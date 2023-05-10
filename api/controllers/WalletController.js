/**
 * WalletController
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
  async read(req, res) {
    try {
      const {
        user: {
          data: { wallet: id },
        },
      } = req;
      const wallet = await Wallet.findOne(id);
      if (!wallet) return responseHelper.json(404, res, 'Wallet not found');
      return responseHelper.json(200, res, 'Wallet retrieved successfully', wallet);
    } catch (err) {
      return responseHelper.error(err, res);
    }
  },
};
