/**
 * VehicleController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
  async create(req, res) {
    try {
      const {
        user: {
          data: { id: user },
        },
        body,
      } = req;
      const { id: driver } = await Driver.findOne({ user });
      const vehicle = await Vehicle.create({ user, driver, ...body }).fetch();
      await Driver.updateOne(driver).set({ vehicle: vehicle.id });
      return responseHelper.json(200, res, 'Vehicle created successfully', { vehicle });
    } catch (e) {
      return responseHelper.error(e, res);
    }
  },

  async update(req, res) {
    try {
      const {
        user: {
          data: { driver },
        },
        body,
        params: { id }
      } = req;
      if (!driver) return responseHelper.json(401, res, 'User is not a driver and has no vehicle');
      const vehicle = await Vehicle.updateOne(id).set({ ...body });
      return responseHelper.json(200, res, 'Vehicle updated successfully', vehicle);
    } catch (err) {
      return responseHelper.error(err, res);
    }
  },

  async read(req, res) {
    try {
      const {
        user: {
          data: { id, driver },
        },
      } = req;
      if (!driver) return responseHelper.json(401, res, 'User is not a driver and has no vehicle');
      const vehicle = await Vehicle.findOne({ user: id });
      if (!vehicle) return responseHelper.json(401, res, 'Driver has no vehicle yet');
      return responseHelper.json(200, res, 'Vehicle retrieved successfully', vehicle)
    } catch (e) {
      return responseHelper.error(e, res)
    }
  }
};
