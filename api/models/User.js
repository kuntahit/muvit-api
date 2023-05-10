/* eslint-disable no-param-reassign */
/**
 * User.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

const bcrypt = require('bcrypt');

module.exports = {
  fetchRecordsOnUpdate: true,
  attributes: {
    driver: {
      model: 'Driver',
    },
    avatar: {
      type: 'string',
      defaultsTo: 'https://i.pravatar.cc/300',
    },
    firstname: {
      type: 'string',
      required: true,
    },
    lastname: {
      type: 'string',
      required: true,
    },
    email: {
      type: 'string',
      unique: true,
      required: true,
    },
    phone_prefix: {
      type: 'string',
      unique: true,
      required: true,
    },
    phone: {
      type: 'string',
      unique: true,
      required: true,
    },
    default_location_pickup: {
      type: 'string',
    },
    role: {
      type: 'json',
      defaultsTo: ['user'],
    },
    device: {
      model: 'Device',
    },
    wallet: {
      model: 'Wallet',
    },
    token: {
      type: 'string',
      allowNull: true,
    },
    password: {
      type: 'string',
    },
  },

  beforeCreate(values, cb) {
    if (!values.prepass || !values.confirmation || values.prepass !== values.confirmation) {
      return cb({
        err: ['Password does not match confirmation'],
      });
    }
    bcrypt.hash(values.prepass, 10, (err, hash) => {
      if (err) {
        return cb(err);
      }
      values.password = hash;
      delete values.prepass;
      delete values.confirmation;

      cb();
    });
  },
  beforeUpdate(values, cb) {
    if (values.password) {
      bcrypt.hash(values.password, 10, (err, hash) => {
        if (err) return cb(err);
        values.password = hash;
        cb();
      });
    } else cb();
  },
  customToJSON() {
    return _.omit(this, ['password', 'token']);
  },
};
