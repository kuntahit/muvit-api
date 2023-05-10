/**
 * LocationController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
  async create(req, res) {
    try {
      const {
        user: {
          data: { id: user, device },
        },
      } = req;

      if (!Array.isArray(req.body)) {
        return responseHelper.json(400, res, 'Invalid array of locations sent');
      }
      const location_data = req.body.map(item => ({
        user,
        device,
        ...item,
      }));
      await Location.createEach(location_data);
      return responseHelper.json(201, res, 'Location data logged successfully');
    } catch (e) {
      return responseHelper.error(e);
    }
  },

  async list(req, res) {
    try {
      const {
        user: {
          data: { id },
        },
      } = req;
      const filter_params = req.body.filter_params || {};
      const { per_page, page: _page } = req.query;
      const perPage = per_page || 100;
      const page = _page || 1;
      const criteria = { user: id, ...filter_params };
      const user = await User.findOne({ id });
      const skip = perPage * (page - 1);
      if (!user) return res.json({ error: 'User not found' });
      const records = await Location.find({ where: criteria, limit: perPage, skip });
      const count = await Location.count(criteria);
      const meta = {
        page,
        prevPage: page > 1 ? page - 1 : false,
        perPage,
        nextPage: count - (skip + perPage) > 0 ? page + 1 : false,
        pageCount: Math.ceil(count / perPage),
        total: count,
      };
      return responseHelper.json(200, res, 'Location data retrieved successfully', records, meta);
    } catch (err) {
      return responseHelper.error(err);
    }
  },
};
