/* eslint-disable no-param-reassign */
/**
 * Ride.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
  attributes: {
    user: {
      model: 'User',
    },
    driver: {
      model: 'Driver',
    },
    vehicle: {
      model: 'Vehicle',
    },
    card: {
      model: 'Card',
    },
    transaction: {
      model: 'Transaction',
    },
    bill: {
      type: 'number',
      required: true,
    },
    code: {
      type: 'string',
    },
    location_origin: {
      type: 'json',
    },
    location_destination: {
      type: 'json',
    },
    payment_method: {
      type: 'string',
    },
    payment_status: {
      type: 'string',
      isIn: ['pending', 'paid', 'failed'],
      defaultsTo: 'pending',
    },
    status: {
      type: 'string',
      isIn: ['pending', 'arriving', 'ongoing', 'cancelled', 'completed'],
      defaultsTo: 'pending',
    },
    rejects: {
      type: 'json',
      defaultsTo: [],
    },
    notified_drivers: {
      type: 'json',
      defaultsTo: [],
    },
    cancelledBy: {
      type: 'string',
      isIn: ['user', 'driver', 'muvit'],
      allowNull: true,
    },
    endedAt: {
      type: 'string',
      allowNull: true,
    },
  },
  beforeCreate(values, cb) {
    values.code = Math.random()
      .toString(36)
      .substring(4)
      .toUpperCase();
    cb();
  },
};
