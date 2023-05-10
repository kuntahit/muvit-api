/**
 * CardController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
  _config: {
    shortcuts: false,
    actions: false,
    rest: false,
  },

  async initialize(req, res) {
    try {
      const {
        user: {
          data: { email, firstname, lastname },
        },
      } = req;
      const transaction_reference = crypto.randomBytes(20).toString('hex');
      const data = await Paystack.transaction.initialize({
        email,
        amount: 10 * 100,
        reference: transaction_reference,
        metadata: {
          custom_fields: [
            { display_name: 'First Name', variable_name: 'firstname', value: firstname },
            { display_name: 'Last Name', variable_name: 'lastname', value: lastname },
          ],
        },
      });

      if(!data.status) return responseHelper.json(400, res, `Paystack error: ${data.message}`)
      return responseHelper.json(201, res, 'Card transaction initialized successfully', data.data);
    } catch (err) {
      responseHelper.error(err, res);
    }
  },

  async create(req, res) {
    try {
      const {
        user: {
          data: { id, wallet },
        },
        body: { transaction_reference },
      } = req;
      const {
        data,
        data: {
          status,
          authorization: { reusable },
        },
      } = await Paystack.transaction.verify(transaction_reference);
      if (status === 'success' && reusable) {
        const {
          authorization,
          customer: { email },
        } = data;
        const card = await Card.create({ user: id, email, wallet, ...authorization }).fetch();
        return responseHelper.json(201, res, 'Card verified and added successfully', { card });
      }
      return responseHelper.json(403, res, 'Unable to verify and add card');
    } catch (err) {
      responseHelper.error(err, res);
    }
  },

  async list(req, res) {
    try {
      const {
        user: {
          data: { id, wallet },
        },
      } = req;
      const { per_page, page: _page } = req.query;
      const perPage = per_page || 20;
      const page = _page || 1;
      const criteria = { wallet, isDeleted: false };
      const user = await User.findOne({ id });
      const skip = perPage * (page - 1);
      if (!user) return responseHelper.json(401, res, 'User not found');
      const records = await Card.find({ where: criteria, limit: perPage, skip });
      const count = await Card.count(criteria);
      const meta = {
        page,
        prevPage: page > 1 ? page - 1 : false,
        perPage,
        nextPage: count - (skip + perPage) > 0 ? page + 1 : false,
        pageCount: Math.ceil(count / perPage),
        total: count,
      };
      return responseHelper.json(200, res, 'Cards retrieved successfully', records, meta);
    } catch (err) {
      responseHelper.error(err, res);
    }
  },

  // async delete(req, res) {

  // },
};
