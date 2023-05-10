/**
 * DeviceController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
  async update(req, res) {
    try {
      const {
        body,
        params: { id }
      } = req;
      const device = await Device.updateOne({ id }).set({ ...body });
      return responseHelper.json(200, res, 'Device updated successfully', {
        device,
      });
    } catch (e) {
      return responseHelper.error(e, res);
    }
  },
};
