/**
 * RideController
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
      return responseHelper.json(201, res, 'Ride pricing information retrived successfully', {
        details,
      });
    } catch (error) {
      return responseHelper.error(error, res);
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

      if (!card_id && payment_method !== 'cash') {
        responseHelper.json(400, res, 'No card selected for payment');
      }
      const {
        distance: { value: distance },
      } = await DistanceService.getDistanceByPlaceID(location_origin, location_destination);
      const bill = PricingService.getRidePrice(distance, return_trip);

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
      const ride = await Ride.create({
        ...req.body,
        bill,
        user: user_id,
        notified_drivers: drivers.map(item => item.id),
      }).fetch();
      const message_data = {
        data: {
          title: 'New ride request',
          action: 'NEW_RIDE_REQUEST',
          ride: ride.id,
          name_origin,
          name_destination,
        },
      };
      const tokens = drivers.map(item => item.fcm_token);
      await FirebaseAdmin.messaging().sendToDevice(tokens, message_data);
      return responseHelper.json(201, res, 'Ride requested successfully', { ride });
    } catch (err) {
      responseHelper.error(err, res);
    }
  },

  async reject(req, res) {
    try {
      const {
        user: {
          data: { driver: driver_id },
        },
        params: { id: ride_id },
      } = req;
      const ride = await Ride.findOne(ride_id);
      if (!ride) return responseHelper.json(404, res, 'Ride does not exist');
      if (!ride.notified_drivers.includes(driver_id)) {
        return responseHelper.json(
          401,
          res,
          'Ride request can only be rejected by a notified driver'
        );
      }
      if (ride.status !== 'pending') {
        return responseHelper.json(401, res, 'Ride unavailable for rejection');
      }
      const updated_ride = await Ride.updateOne(ride_id).set({
        rejects: [...ride.rejects, driver_id],
      });
      if (updated_ride.rejects.length === updated_ride.notified_drivers.length) {
        const {
          device: { fcm_token },
        } = await User.findOne(ride.user).populate('device');
        const message_data = {
          data: {
            title: 'No driver available for ride',
            action: 'DRIVERS_UNAVAILABLE',
            ride: ride_id,
          },
        };
        await FirebaseAdmin.messaging().sendToDevice(fcm_token, message_data);
      }

      return responseHelper.json(200, res, 'Ride request rejected successfully');
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
        params: { id: ride_id },
      } = req;
      const ride = await Ride.findOne(ride_id);
      if (!ride) return responseHelper.json(404, res, 'Ride does not exist');
      if (ride.user !== user_id && ride.driver !== driver_id) {
        return responseHelper.json(
          401,
          res,
          'Ride can only be cancelled by the driver or customer requesting the ride'
        );
      }
      if (['completed', 'cancelled'].includes(ride.status)) {
        return responseHelper.json(401, res, 'Ride already completed or cancelled');
      }

      const drivers = await Driver.find({ id: ride.notified_drivers });
      const driver_ids = drivers.map(({ user }) => user);
      const users = await User.find({ id: [...driver_ids, ride.user] }).populate('device');
      const tokens = users.map(({ device: { fcm_token } }) => fcm_token);

      const message_data = {
        data: {
          title: `Ride #${ride.code} has been cancelled by the ${driver_id ? 'driver' : 'user'},`,
          action: 'RIDE_CANCELLED',
          ride: ride_id,
        },
      };

      if (ride.driver) await Driver.updateOne(ride.driver).set({ status: 'available' });

      const updated_ride = await Ride.updateOne(ride_id).set({
        status: 'cancelled',
        cancelledBy: driver_id ? 'driver' : 'user',
      });

      await FirebaseAdmin.messaging().sendToDevice(tokens, message_data);

      return responseHelper.json(200, res, 'Ride cancelled successfully', { ride: updated_ride });
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
        params: { id: ride_id },
      } = req;
      const ride = await Ride.findOne(ride_id);
      if (!ride) return responseHelper.json(404, res, 'Ride does not exist');
      if (!ride.notified_drivers.includes(driver_id)) {
        return responseHelper.json(401, res, 'Ride can only be accepted by a notified driver');
      }
      if (ride.rejects.includes(driver_id)) {
        return responseHelper.json(401, res, 'Ride has previously been rejected by driver');
      }
      if (ride.status !== 'pending') {
        return responseHelper.json(401, res, 'Ride unavailable for acceptance');
      }
      const { vehicle } = await Driver.findOne(driver_id);
      await Ride.updateOne(ride_id).set({ driver: driver_id, vehicle, status: 'arriving' });
      await Driver.updateOne(driver_id).set({ status: 'engaged' });

      const {
        device: { fcm_token },
      } = await User.findOne(ride.user).populate('device');

      const message_data = {
        data: {
          title: 'Your ride request has been accepted and a driver is coming to you',
          action: 'RIDE_ACCEPTED',
          ride: ride_id,
        },
      };
      await FirebaseAdmin.messaging().sendToDevice(fcm_token, message_data);

      return responseHelper.json(200, res, 'Ride request accepted successfully');
    } catch (e) {
      return responseHelper.error(e, res);
    }
  },

  async commence(req, res) {
    try {
      const {
        user: {
          data: { id, driver: driver_id },
        },
        params: { id: ride_id },
      } = req;

      const ride = await Ride.findOne(ride_id);
      if (!ride) return responseHelper.json(404, res, 'Ride does not exist');
      if (ride.driver !== driver_id) {
        return responseHelper.json(
          401,
          res,
          'Ride can only be commenced by the driver who accepted'
        );
      }
      if (ride.status !== 'arriving') {
        return responseHelper.json(401, res, 'Ride unavailable for commencement');
      }

      const users = await User.find({ id: [ride.user, id] }).populate('device');
      const tokens = users.map(({ device: { fcm_token } }) => fcm_token);
      let message_data = {};

      let reference = null;
      if (ride.payment_method === 'card') {
        const card = await Card.findOne(ride.card);
        // Check if payment information is valid
        if (!card) {
          // Cancel ride if payment information is invalid
          await Ride.updateOne(ride_id).set({
            payment_status: 'failed',
            status: 'cancelled',
            cancelledBy: 'muvit',
          });
          await Driver.updateOne(driver_id).set({ status: 'available' });
          // Send notification to driver and user, that the ride has been cancelled by muvit due to invalid payment information
          message_data = {
            data: {
              title: `Ride #${ride.code} has been cancelled due to invalid payment information`,
              action: 'RIDE_CANCELLED',
              ride: ride_id,
            },
          };
          await FirebaseAdmin.messaging().sendToDevice(tokens, message_data);
          return responseHelper.json(400, res, 'Invalid payment method, please order ride again');
        }
        const { authorization_code, email } = card;
        reference = crypto.randomBytes(20).toString('hex');

        const {
          data: { status },
        } = await Paystack.transaction.charge({
          email,
          amount: ride.bill * 100,
          authorization_code,
          reference,
        });

        if (status !== 'success') {
          // Cancel ride if payment fails is invalid
          await Ride.updateOne(ride_id).set({
            payment_status: 'failed',
            status: 'cancelled',
            cancelledBy: 'muvit',
          });
          await Driver.updateOne(driver_id).set({ status: 'available' });
          // Send notification to driver and user, that the ride has been cancelled by muvit due to payment failure
          message_data = {
            data: {
              title: `Ride #${ride.code} has been cancelled due to invalid payment information`,
              action: 'RIDE_CANCELLED',
              ride: ride_id,
            },
          };
          await FirebaseAdmin.messaging().sendToDevice(tokens, message_data);
          return responseHelper.json(
            400,
            res,
            'Unable to create ride due to payment failure',
            null
          );
        }
      }

      const transaction = await Transaction.create({
        type: 'debit',
        user: ride.user,
        ride: ride.id,
        amount: ride.bill,
        card: ride.card,
        destination: 'muvit',
        reference,
        description: `${ride.payment_method === 'cash' ? 'Cash' : 'Card'} payment for ride`,
        status: ride.payment_method === 'cash' ? 'pending' : 'successful',
      }).fetch();

      await Ride.updateOne(ride_id).set({
        status: 'ongoing',
        payment_status: ride.payment_method === 'card' ? 'paid' : 'pending',
        transaction: transaction.id,
      });

      message_data = {
        data: {
          title: `Ride #${ride.code} has been commenced`,
          action: 'RIDE_COMMENCED',
          ride: ride_id,
        },
      };
      await FirebaseAdmin.messaging().sendToDevice(tokens, message_data);

      return responseHelper.json(200, res, 'Ride commenced successfully', { transaction });
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
        params: { id: ride_id },
      } = req;
      const ride = await Ride.findOne(ride_id);
      if (!ride) return responseHelper.json(404, res, 'Ride does not exist');
      if (ride.driver !== driver_id) {
        return responseHelper.json(401, res, 'Ride can only be ended by the driver');
      }
      if (ride.status !== 'ongoing') {
        return responseHelper.json(401, res, 'Ride unavailable for completion');
      }
      const updated_ride = await Ride.updateOne(ride_id).set({
        payment_status: 'paid',
        status: 'completed',
        endedAt: moment().toISOString(),
      });
      if (ride.payment_method === 'cash') {
        await Transaction.updateOne(ride.transaction).set({
          status: 'successful',
        });
      }

      const wallet = await Wallet.findOne(wallet_id);
      const driver_pay = ride.bill * 0.8;

      const updated_wallet = await Wallet.updateOne(wallet_id).set({
        total_profit: wallet.total_profit + driver_pay,
        balance: wallet.balance + driver_pay,
      });

      await Transaction.create({
        type: 'credit',
        user: id,
        ride: ride_id,
        amount: ride.bill * 0.8,
        destination: 'wallet',
        description: 'Wallet credit for ride',
        status: 'successful',
      });

      await Driver.updateOne(driver_id).set({ status: 'available' });

      // Send completion notifications to driver and user devices
      const users = await User.find({ id: [ride.user, id] }).populate('device');
      const tokens = users.map(({ device: { fcm_token } }) => fcm_token);
      const message_data = {
        data: {
          title: `Ride #${ride.code} has been completed`,
          action: 'COMPLETED',
          ride: ride_id,
        },
      };
      await FirebaseAdmin.messaging().sendToDevice(tokens, message_data);

      return responseHelper.json(200, res, 'Ride ended successfully', {
        ride: updated_ride,
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
      const ride = await Ride.findOne(id).populateAll();
      if (!ride) return responseHelper.json(404, res, 'Ride not found');
      const { user } = await Driver.findOne(ride.driver).populate('user');
      ride.driver = user;
      return responseHelper.json(200, res, 'Ride retrieved successfully', ride);
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
      const records = await Ride.find({ where: criteria, limit: perPage, skip });
      const count = await Ride.count(criteria);
      const meta = {
        page,
        prevPage: page > 1 ? page - 1 : false,
        perPage,
        nextPage: count - (skip + perPage) > 0 ? page + 1 : false,
        pageCount: Math.ceil(count / perPage),
        total: count,
      };
      return responseHelper.json(200, res, 'Rides retrieved successfully', records, meta);
    } catch (err) {
      responseHelper.error(err, res);
    }
  },
};
