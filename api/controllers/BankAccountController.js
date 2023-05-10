/**
 * BankAccountController
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

  async verify(req, res) {
    try {
      const { account_number, bank_code } = req.body;
      const payload = { account_number, bank_code };
      const {
        data: { data },
      } = await Axios({
        url: 'https://api.paystack.co/bank/resolve',
        method: 'GET',
        params: payload,
        headers: {
          Authorization: `Bearer ${sails.config.custom.paystack.secret_key}`,
        },
      });
      return responseHelper.json(200, res, 'Bank account verified successfully', {
        ...payload,
        ...data,
      });
    } catch (e) {
      if (e.response) {
        if (e.response.data) {
          return responseHelper.json(403, res, 'Unable to verify account details');
        }
      }
      return responseHelper.error(e);
    }
  },
  async create(req, res) {
    try {
      const {
        user: {
          data: { wallet, id: user },
        },
      } = req;
      const {
        data: { data },
      } = await Axios({
        url: 'https://api.paystack.co/transferrecipient',
        method: 'POST',
        data: {
          type: 'nuban',
          ...req.body,
        },
        headers: {
          Authorization: `Bearer ${sails.config.custom.paystack.secret_key}`,
        },
      });

      const {
        name: account_name,
        recipient_code,
        details: { account_number, bank_name, bank_code },
      } = data;

      const bank_account = await BankAccount.create({
        user,
        wallet,
        account_name,
        recipient_code,
        account_number,
        bank_name,
        bank_code,
      }).fetch();

      return responseHelper.json(200, res, 'Bank account added successfully', bank_account);
    } catch (e) {
      return responseHelper.error(e);
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
      const records = await BankAccount.find({ where: criteria, limit: perPage, skip });
      const count = await BankAccount.count(criteria);
      const meta = {
        page,
        prevPage: page > 1 ? page - 1 : false,
        perPage,
        nextPage: count - (skip + perPage) > 0 ? page + 1 : false,
        pageCount: Math.ceil(count / perPage),
        total: count,
      };
      return responseHelper.json(200, res, 'Bank accounts retrieved successfully', records, meta);
    } catch (err) {
      responseHelper.error(err);
    }
  },
  async delete(req, res) { },

  async listBanks(req, res) {
    try {
      const { data } = await Axios({
        url: 'https://api.paystack.co/bank',
        method: 'GET',
        headers: {
          Authorization: `Bearer ${sails.config.custom.paystack.secret_key}`,
        },
      })

      if (!data.status) return responseHelper.json(403, res, 'Failed to retrieve bank list')
      const banks = data.data.map(({ name, code, slug, id }) => ({ slug, id, value: code, label: name }));
      return responseHelper.json(200, res, 'Bank List fetched successfully', banks);

    } catch (e) {
      console.log(e.response ? e.response : e);
      return responseHelper.error(e, res);
    }
  }
};
