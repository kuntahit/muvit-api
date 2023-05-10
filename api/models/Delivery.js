/* eslint-disable no-param-reassign */
/**
 * Delivery.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
  fetchRecordsOnUpdate: true,
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
    bill: {
      type: 'number',
      required: true,
    },
    code: {
      type: 'string',
    },
    name_pickup: {
      type: 'string',
    },
    name_delivery: {
      type: 'string',
    },
    location_origin: {
      type: 'json',
    },
    location_destination: {
      type: 'json',
    },
    phone_pickup: {
      type: 'string',
    },
    phone_delivery: {
      type: 'string',
    },
    return_trip: {
      type: 'boolean',
      defaultsTo: false,
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
    current_trip: {
      type: 'number',
      defaultsTo: 0,
    },
    cash_payment_bearer: {
      type: 'string',
      allowNull: true,
      isIn: ['origin', 'destination'],
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
