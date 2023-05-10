/**
 * DeliveriesController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
  _config: {
    actions: false,
    shortcuts: false,
    rest: false,
  },

  async getPricingInfo(req, res) {
    try {
      const { location_origin, location_destination, return_trip } = req.body;
      const {
        distance,
        duration: { text: duration },
      } = await DistanceService.getDistanceByPlaceID(location_origin, location_destination);
      const bill = PricingService.getDeliveryPrice(distance.value, return_trip);
      const details = { distance: distance.text, duration, bill };
      return responseHelper.json(201, res, 'Delivery pricing information retrived successfully', {
        details,
      });
    } catch (e) {
      return responseHelper.error(e, res);
    }
  },

  async create(req, res) {
    try {
      const {
        user: {
          data: { id: user_id },
        },
        body: {
          payment_method,
          return_trip,
          card: card_id,
          location_origin: {
            placeID: location_origin,
            location: coordinates_origin,
            name: name_origin,
          },
          location_destination: { placeID: location_destination, name: name_destination },
        },
      } = req;

      if (!card_id && payment_method !== 'cash')
        return responseHelper.json(400, res, 'No card selected for payment');

      const {
        distance: { value: distance },
      } = await DistanceService.getDistanceByPlaceID(location_origin, location_destination);
      const bill = PricingService.getDeliveryPrice(distance, return_trip);

      const available_drivers = await Driver.find({
        status: 'available',
        vehicle: {
          '!=': null,
        },
      }).populate('user');

      // Get latest location of available drivers
      let drivers = await Promise.all(
        available_drivers.map(async item => {
          const {
            user: { id: user, device },
          } = item;
          const last_location = await Location.find({
            where: { user },
            limit: 1,
            sort: 'createdAt DESC',
          });
          if (last_location.length === 0) {
            return item;
          }
          const { geo_coordinates: location } = last_location[0];
          const {
            distance: estimated_distance,
            duration: eta,
          } = await DistanceService.getDistanceByGeoCoordinates(
            [coordinates_origin.latitude, coordinates_origin.longitude],
            location
          );
          return {
            ...item,
            location,
            estimated_distance,
            eta,
            user,
            device,
          };
        })
      );

      // TODO: Filter by status of drivers i.e online, not currently engaged in a ride or delivery
      //  using PubNub presence implementation

      drivers = drivers.filter(item => item.location && item.eta && item.estimated_distance);
      drivers = drivers.sort(
        ({ estimated_distance: { value: a } }, { estimated_distance: { value: b } }) => a - b
      );
      drivers = drivers.filter(({ estimated_distance: { value } }) => value <= 7000);
      drivers = drivers.filter((item, index) => index <= 5);
      if (drivers.length === 0) {
        return responseHelper.json(
          404,
          res,
          'No drivers are currently available, please try again in a few minutes'
        );
      }
      drivers = await Promise.all(
        drivers.map(async item => {
          const { device } = item;
          const { fcm_token } = await Device.findOne(device);
          return {
            ...item,
            fcm_token,
          };
        })
      );

      const delivery = await Delivery.create({
        ...req.body,
        bill,
        user: user_id,
        notified_drivers: drivers.map(item => item.id),
      }).fetch();

      const message_data = {
        data: {
          title: 'New delivery request',
          action: 'NEW_DELIVERY_REQUEST',
          delivery: delivery.id,
          name_origin,
          name_destination,
        },
      };

      const tokens = drivers.map(item => item.fcm_token);
      await FirebaseAdmin.messaging().sendToDevice(tokens, message_data);
      return responseHelper.json(201, res, 'Delivery requested successfully', { delivery });
    } catch (e) {
      return responseHelper.error(e, res);
    }
  },

  async reject(req, res) {
    try {
      const {
        user: {
          data: { driver: driver_id },
        },
        params: { id: delivery_id },
      } = req;
      const delivery = await Delivery.findOne(delivery_id);
      if (!delivery) return responseHelper.json(404, res, 'Delivery does not exist');
      if (!delivery.notified_drivers.includes(driver_id)) {
        return responseHelper.json(
          401,
          res,
          'Delivery request can only be rejected by a notified driver'
        );
      }
      if (delivery.status !== 'pending') {
        return responseHelper.json(401, res, 'Delivery unavailable for rejection');
      }
      const updated_delivery = await Delivery.updateOne(delivery_id).set({
        rejects: [...delivery.rejects, driver_id],
      });
      if (updated_delivery.rejects.length === updated_delivery.notified_drivers.length) {
        const {
          device: { fcm_token },
        } = await User.findOne(delivery.user).populate('device');
        const message_data = {
          data: {
            title: 'No driver available for delivery',
            action: 'DRIVERS_UNAVAILABLE',
            delivery: delivery_id,
          },
        };
        await FirebaseAdmin.messaging().sendToDevice(fcm_token, message_data);
      }

      return responseHelper.json(200, res, 'Delivery request rejected successfully');
    } catch (e) {
      return responseHelper.error(e, res);
    }
  },

  async cancel(req, res) {
    try {
      const {
        user: {
          data: { id: user_id, driver: driver_id },
        },
        params: { id: delivery_id },
      } = req;
      const delivery = await Delivery.findOne(delivery_id);
      if (!delivery) return responseHelper.json(404, res, 'Delivery does not exist');
      if (delivery.user !== user_id && delivery.driver !== driver_id) {
        return responseHelper.json(
          401,
          res,
          'Delivery can only be cancelled by the driver or customer requesting the delivery'
        );
      }
      if (['completed', 'cancelled'].includes(delivery.status)) {
        return responseHelper.json(401, res, 'Delivery already completed or cancelled');
      }

      const drivers = await Driver.find({ id: delivery.notified_drivers });
      const driver_ids = drivers.map(({ user }) => user);
      const users = await User.find({ id: [...driver_ids, delivery.user] }).populate('device');
      const tokens = users.map(({ device: { fcm_token } }) => fcm_token);

      const message_data = {
        data: {
          title: `Delivery #${delivery.code} has been cancelled by the ${
            driver_id ? 'driver' : 'user'
          },`,
          action: 'DELIVERY_CANCELLED',
          ride: delivery_id,
        },
      };

      if (delivery.driver) await Driver.updateOne(delivery.driver).set({ status: 'available' });

      const updated_delivery = await Delivery.updateOne(delivery_id).set({
        status: 'cancelled',
        cancelledBy: driver_id ? 'driver' : 'user',
      });
      await FirebaseAdmin.messaging().sendToDevice(tokens, message_data);

      return responseHelper.json(200, res, 'Delivery cancelled successfully', {
        delivery: updated_delivery,
      });
    } catch (e) {
      return responseHelper.error(e, res);
    }
  },

  async accept(req, res) {
    try {
      const {
        user: {
          data: { driver: driver_id },
        },
        params: { id: delivery_id },
      } = req;
      const delivery = await Delivery.findOne(delivery_id);
      if (!delivery) return responseHelper.json(404, res, 'Delivery does not exist');
      if (!delivery.notified_drivers.includes(driver_id)) {
        return responseHelper.json(401, res, 'Delivery can only be accepted by a notified driver');
      }
      if (delivery.rejects.includes(driver_id)) {
        return responseHelper.json(401, res, 'Delivery has previously been rejected by driver');
      }
      if (delivery.status !== 'pending') {
        return responseHelper.json(401, res, 'Delivery unavailable for acceptance');
      }
      const { vehicle } = await Driver.findOne(driver_id);
      await Delivery.updateOne(delivery_id).set({ driver: driver_id, vehicle, status: 'arriving' });
      await Driver.updateOne(driver_id).set({ status: 'engaged' });

      const {
        device: { fcm_token },
      } = await User.findOne(delivery.user).populate('device');

      const message_data = {
        data: {
          title: 'Your delivery request has been accepted and a driver is coming to you',
          action: 'DELIVERY_ACCEPTED',
          delivery: delivery_id,
        },
      };
      await FirebaseAdmin.messaging().sendToDevice(fcm_token, message_data);

      return responseHelper.json(200, res, 'Delivery request accepted successfully');
    } catch (e) {
      return responseHelper.error(e, res);
    }
  },

  async commence(req, res) {
    try {
      const {
        user: {
          data: { driver: driver_id },
        },
        params: { id: delivery_id },
      } = req;

      const delivery = await Delivery.findOne(delivery_id);
      if (!delivery) return responseHelper.json(404, res, 'Delivery does not exist');
      if (delivery.driver !== driver_id) {
        return responseHelper.json(
          401,
          res,
          'Delivery can only be commenced by the driver who accepted'
        );
      }
      if (delivery.status !== 'arriving')
        return responseHelper.json(401, res, 'Delivery unavailable for commencement');

      const users = await User.find({ id: [delivery.user, delivery.driver] }).populate('device');
      const tokens = users.map(({ device: { fcm_token } }) => fcm_token);
      let message_data = {};

      let reference = null;
      if (delivery.payment_method === 'card') {
        const card = await Card.findOne(delivery.card);
        // Check if payment information is valid
        if (!card) {
          // Cancel delivery if payment information is invalid
          await Delivery.updateOne(delivery_id).set({
            payment_status: 'failed',
            status: 'cancelled',
            cancelledBy: 'muvit',
          });
          await Driver.updateOne(driver_id).set({ status: 'available' });
          // Send notification to driver and user, that the delivery has been cancelled by muvit due to invalid payment information
          message_data = {
            data: {
              title: `Delivery #${delivery.code} has been cancelled due to invalid payment information`,
              action: 'DELIVERY_CANCELLED',
              delivery: delivery_id,
            },
          };
          await FirebaseAdmin.messaging().sendToDevice(tokens, message_data);
          return responseHelper.json(
            400,
            res,
            'Invalid payment method, please order delivery again'
          );
        }
        const { authorization_code, email } = card;
        reference = crypto.randomBytes(20).toString('hex');

        const {
          data: { status },
        } = await Paystack.transaction.charge({
          email,
          amount: delivery.bill * 100,
          authorization_code,
          reference,
        });

        if (status !== 'success') {
          // Cancel delivery if payment fails is invalid
          await Delivery.updateOne(delivery_id).set({
            payment_status: 'failed',
            status: 'cancelled',
            cancelledBy: 'muvit',
          });
          await Driver.updateOne(driver_id).set({ status: 'available' });
          // Send notification to driver and user, that the delivery has been cancelled by muvit due to payment failure
          message_data = {
            data: {
              title: `Delivery #${delivery.code} has been cancelled due to invalid payment information`,
              action: 'DELIVERY_CANCELLED',
              delivery: delivery_id,
            },
          };
          await FirebaseAdmin.messaging().sendToDevice(tokens, message_data);
          return responseHelper.json(
            400,
            res,
            'Unable to create delivery due to payment failure',
            null
          );
        }
      }

      const transaction = await Transaction.create({
        type: 'debit',
        user: delivery.user,
        delivery: delivery.id,
        amount: delivery.bill,
        card: delivery.card,
        destination: 'muvit',
        reference,
        description: `${delivery.payment_method === 'cash' ? 'Cash' : 'Card'} payment for delivery`,
        status: delivery.payment_method === 'cash' ? 'pending' : 'successful',
      }).fetch();

      await Delivery.updateOne(delivery_id).set({
        current_trip: 1,
        status: 'ongoing',
        payment_status: delivery.payment_method === 'card' ? 'paid' : 'pending',
        transaction: transaction.id,
      });

      message_data = {
        data: {
          title: `Delivery #${delivery.code} has been commenced`,
          action: 'DELIVERY_COMMENCED',
          delivery: delivery_id,
        },
      };
      await FirebaseAdmin.messaging().sendToDevice(tokens, message_data);
      return responseHelper.json(200, res, 'Delivery commenced successfully', { transaction });
    } catch (e) {
      return responseHelper.error(e, res);
    }
  },

  async end(req, res) {
    try {
      const {
        user: {
          data: { id, driver: driver_id, wallet: wallet_id },
        },
        params: { id: delivery_id },
      } = req;
      const delivery = await Delivery.findOne(delivery_id);
      if (!delivery) return responseHelper.json(404, res, 'Delivery does not exist');
      if (delivery.driver !== driver_id)
        return responseHelper.json(401, res, 'Delivery can only be ended by the driver');

      if (delivery.status !== 'ongoing') {
        return responseHelper.json(401, res, 'Delivery unavailable for completion');
      }
      const updated_delivery = await Delivery.updateOne(delivery_id).set({
        payment_status: 'paid',
        status: 'completed',
        endedAt: moment().toISOString(),
      });
      if (delivery.payment_method === 'cash') {
        await Transaction.updateOne(delivery.transaction).set({
          status: 'successful',
        });
      }

      const wallet = await Wallet.findOne(wallet_id);
      const driver_pay = delivery.bill * 0.8;

      const updated_wallet = await Wallet.updateOne(wallet_id).set({
        total_profit: wallet.total_profit + driver_pay,
        balance: wallet.balance + driver_pay,
      });

      await Transaction.create({
        type: 'credit',
        user: id,
        delivery: delivery_id,
        amount: delivery.bill * 0.8,
        destination: 'wallet',
        description: 'Wallet credit for delivery',
        status: 'successful',
      });

      await Driver.updateOne(driver_id).set({ status: 'available' });

      // Send completion notifications to driver and user devices
      const users = await User.find({ id: [delivery.user, id] }).populate('device');
      const tokens = users.map(({ device: { fcm_token } }) => fcm_token);
      const message_data = {
        data: {
          title: `Delivery #${delivery.code} has been completed`,
          action: 'COMPLETED',
          delivery: delivery_id,
        },
      };
      await FirebaseAdmin.messaging().sendToDevice(tokens, message_data);

      return responseHelper.json(200, res, 'Delivery ended successfully', {
        delivery: updated_delivery,
        wallet: updated_wallet,
      });
    } catch (e) {
      return responseHelper.error(e, res);
    }
  },

  async read(req, res) {
    try {
      const {
        params: { id },
      } = req;
      const delivery = await Delivery.findOne(id).populateAll();
      if (!delivery) return responseHelper.json(404, res, 'Delivery not found');
      const { user } = await Driver.findOne(delivery.driver).populate('user');
      delivery.driver = user;
      return responseHelper.json(200, res, 'Delivery retrieved successfully', delivery);
    } catch (e) {
      responseHelper.error(e, res);
    }
  },

  async list(req, res) {
    try {
      const {
        user: {
          data: { id, driver },
        },
      } = req;
      const { per_page, page: _page } = req.query;
      const perPage = per_page || 20;
      const page = _page || 1;
      const criteria = { status: ['completed', 'cancelled'], or: [{ user: id }, { driver }] };
      const user = await User.findOne({ id });
      const skip = perPage * (page - 1);
      if (!user) return res.json({ error: 'User not found' });
      const records = await Delivery.find({ where: criteria, limit: perPage, skip });
      const count = await Delivery.count(criteria);
      const meta = {
        page,
        prevPage: page > 1 ? page - 1 : false,
        perPage,
        nextPage: count - (skip + perPage) > 0 ? page + 1 : false,
        pageCount: Math.ceil(count / perPage),
        total: count,
      };
      return responseHelper.json(200, res, 'Deliveries retrieved successfully', records, meta);
    } catch (err) {
      responseHelper.error(err);
    }
  },
};
