/**
 * TransactionController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {

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
      if (!user) return responseHelper.json(401, res, 'User not found');
      const records = await Transaction.find({ where: criteria, limit: perPage, skip });
      const count = await Transaction.count(criteria);
      const meta = {
        page,
        prevPage: page > 1 ? page - 1 : false,
        perPage,
        nextPage: count - (skip + perPage) > 0 ? page + 1 : false,
        pageCount: Math.ceil(count / perPage),
        total: count,
      };
      return responseHelper.json(200, res, 'Transactions retrieved successfully', records, meta);
    } catch (err) {
      responseHelper.error(err);
    }
  },


  async getWallet(req, res) {
    try {
      const {
        user: {
          data: { id: owner },
        },
      } = req;

      const wallet = await Wallet.findOne({ owner })
        .populate('bank_accounts')
        .populate('cards');
      return responseHelper.json(201, res, 'Wallet retrieved successfully', {
        wallet,
      });
    } catch (e) {
      return responseHelper.error(e);
    }
  },

  async withdraw(req, res) {
    try {
      const {
        user: {
          data: { id: owner },
        },
        body: { amount, account },
      } = req;

      const wallet = await Wallet.findOne({ owner });
      if (!wallet) return responseHelper.json(400, res, 'Wallet not found');
      if (wallet.balance < amount) {
        return responseHelper.json(400, res, 'Insufficient funds in wallet');
      }
      const bank_account = await BankAccount.findOne(account);
      if (!bank_account) return responseHelper.json(400, res, 'Bank account not found');
      if (wallet.owner !== bank_account.user) {
        return responseHelper.json(400, res, 'Account does not belong to User');
      }
      const reference = crypto.randomBytes(20).toString('hex');
      await Axios({
        url: 'https://api.paystack.co/transfer',
        method: 'POST',
        data: {
          source: 'balance',
          amount: amount * 100,
          reason: `Muvit wallet withdrawal to ${bank_account.account_name}`,
          recipient: bank_account.recipient_code,
          reference,
        },
        headers: {
          Authorization: `Bearer ${sails.config.custom.paystack.secret_key}`,
        },
      });

      const updated_wallet = await Wallet.updateOne({ owner }).set({
        balance: wallet.balance - bill,
        next_withdrawal: moment().add(1, 'w').toISOString(),
      })

      const transaction = await Transaction.create({
        type: 'debit',
        user: owner,
        bank_account: account,
        amount,
        destination: 'bank-account',
        reference,
        description: 'Wallet withdrawal',
        status: 'successful',
      }).fetch();

      return responseHelper.json(201, res, 'Transfer initialized successfully', { transaction, wallet: updated_walllet });
    } catch (err) {
      if (err.response) {
        if (err.response.data) {
          return responseHelper.json(400, res, 'Failed to initialize transfer');
        }
      }
      return responseHelper.error(err);
    }
  },
};
