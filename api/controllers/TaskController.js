/**
 * TaskController
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
      const { location_pickup, location_delivery, return_trip } = req.body;
      const {
        distance,
        duration: { text: duration },
      } = await DistanceService.getDistanceByPlaceID(location_pickup, location_delivery);
      const bill = PricingService.getDeliveryPrice(distance.value, return_trip);
      const details = { distance: distance.text, duration, bill };
      return responseHelper.json(201, res, 'Delivery pricing information retrived successfully', {
        details,
      });
    } catch (error) {
      return responseHelper.error(error);
    }
  },

  async create(req, res) {
    try {
      const {
        user: {
          data: { id, firstname, lastname },
        },
        body: {
          payment_method,
          card: card_id,
          return_trip,
          location_pickup: { placeID: location_pickup },
          location_delivery: { placeID: location_delivery },
        },
      } = req;
      const {
        distance: { value: distance },
      } = await DistanceService.getDistanceByPlaceID(location_pickup, location_delivery);
      const bill = PricingService.getDeliveryPrice(distance, return_trip);
      let transaction_reference = null;
      if (payment_method === 'card') {
        const { authorization_code, email } = await Card.findOne(card_id);

        transaction_reference = crypto.randomBytes(20).toString('hex');
        const {
          data: { status },
        } = await Paystack.transaction.charge({
          email,
          amount: bill * 100,
          authorization_code,
          reference: transaction_reference,
        });
        if (status !== 'success')
          return responseHelper.json(
            401,
            res,
            'Unable to create delivery due to payment failure',
            null
          );
      }
      const payload = {
        ...req.body,
        user: id,
        bill,
        completion_status: 'pending',
        transaction_reference,
        payment_status: payment_method === 'card' ? 'paid' : 'pending',
      };
      const task = await Task.create(payload).fetch();
      NotificationService.newDeliverySlackNotify({ ...task, firstname, lastname });
      return responseHelper.json(201, res, 'Task created successfully', { task });
    } catch (err) {
      responseHelper.error(err);
    }
  },

  async confirmPayment(req, res) {
    try {
      const { taskId } = req.body;
      const _task = await Task.findOne({ id: taskId });
      const { payment_method } = _task;
      const payload = {
        completion_status: payment_method === 'cash' ? 'completed' : 'ongoing',
        payment_status: 'paid',
      };
      const task = await Task.updateOne({ id: taskId }).set(payload);
      return res.json({ data: task });
    } catch (err) {
      return res.serverError(err);
    }
  },

  async list(req, res) {
    try {
      const {
        user: {
          data: { id },
        },
      } = req;
      const { per_page, page: _page } = req.query;
      const perPage = per_page || 20;
      const page = _page || 1;
      const criteria = { user: id };
      const user = await User.findOne({ id });
      const skip = perPage * (page - 1);
      if (!user) return res.json({ error: 'User not found' });
      const records = await Task.find({ where: criteria, limit: perPage, skip });
      const count = await Task.count(criteria);
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
