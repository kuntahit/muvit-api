/**
 * UserController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

const bcrypt = require('bcrypt');

module.exports = {
  _config: {
    actions: false,
    shortcuts: false,
    rest: false,
  },
  async signup(req, res) {
    try {
      const {
        body: { email, device: _device },
      } = req;
      const users = await User.find({ email });
      if (users.length > 0) {
        return res.json(400, { error: 'Email already taken' });
      }
      const _user = await User.create({ ...req.body, device: null }).fetch();
      const { role } = req.body;
      let driver = null;
      if (role.includes('driver')) {
        driver = await Driver.create({ user: _user.id, status: 'available' }).fetch();
        driver = driver.id;
      }
      const wallet = await Wallet.create({ owner: _user.id }).fetch();
      const device = await Device.create({ ..._device, user: _user.id }).fetch();
      const token = jwtService.sign({ ..._user, device: device.id, wallet: wallet.id, driver });
      const user = await User.updateOne({ id: _user.id }).set({
        token,
        driver,
        device: device.id,
        wallet: wallet.id,
      });
      return responseHelper.json(201, res, 'User registered successfully', { user, device, wallet, token });
    } catch (err) {
      return responseHelper.error(err, res);
    }
  },

  async login(req, res) {
    try {
      const {
        body: { email, password, device: _device },
      } = req;
      if (!email || !password) {
        return res.badRequest({
          err: 'Email or password cannot be empty',
        });
      }
      const user = await User.findOne({ email });
      if (!user) {
        return responseHelper.json(404, res, `Could not find email ${email}`);
      }
      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) return responseHelper.json(401, res, `Invalid password ${email}`);
      const { uuid } = _device;
      let device = await Device.findOne({ user: user.id, uuid });
      if (!device) device = await Device.create({ ..._device, user: user.id }).fetch();
      const wallet =await Wallet.findOne({ owner: user.id }).populateAll();
      const token = jwtService.sign({
        ...user,
        device: device.id,
        wallet: wallet.id,
        token: null,
      });
      const _user = await User.updateOne({ id: user.id }).set({ token, device: device.id });
      return responseHelper.json(200, res, 'User logged in successfully', {
        user: _user,
        device,
        wallet,
        token,
      });
    } catch (err) {
      return responseHelper.error(err, res);
    }
  },

  async update(req, res) {
    try {
      const {
        user: {
          data: { id },
        },
        body,
      } = req;
      const user = await User.updateOne({ id }).set({ ...body });
      return responseHelper.json(200, res, 'User updated successfully', {
        user,
      });
    } catch (err) {
      return responseHelper.error(err, res);
    }
  },

  async changePassword(req, res) {
    try {
      const {
        user: {
          data: { id },
        },
        body,
      } = req;
      const user = await User.findOne(id);
      if (!user) return responseHelper.json(401, res, 'User does not exist');

      const { prepass, current_password, confirmation } = body;
      const isValid = await bcrypt.compare(current_password, user.password);
      if (!isValid) return responseHelper.json(401, res, 'Current password is incorrect');
      if (prepass !== confirmation) return responseHelper.json(401, res, 'Passwords do not match');
      const token = jwtService.sign({ ...user, token: null });

      const updated_user = await User.updateOne(id).set({
        password: prepass,
        token,
      });

      return responseHelper.json(200, res, 'Password changed successfully', {
        user: updated_user,
        token
      });
    } catch (e) {
      return responseHelper.error(e, res);
    }
  },

  async read(req, res) {
    try {
      const {
        user: {
          data: { id },
        },
      } = req;
      const user = await User.findOne({ id }).populateAll();
      return responseHelper.json(200, res, 'User retreived successfully', user);
    } catch (err) {
      return responseHelper.error(err, res);
    }
  },
};
