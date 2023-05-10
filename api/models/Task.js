/* eslint-disable no-param-reassign */
/**
 * Task.js
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
      model: 'User',
    },
    card: {
      model: 'Card',
    },
    bill: {
      type: 'number',
      required: true,
    },
    transaction: {
      model: 'Transaction',
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
    location_pickup: {
      type: 'json',
    },
    location_delivery: {
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
      defaultsTo: 'pending',
    },
    completion_status: {
      type: 'string',
      defaultsTo: 'pending',
    },
    cash_payment_bearer: {
      type: 'string',
      allowNull: true,
    },
    isCancelled: {
      type: 'boolean',
      defaultsTo: false,
    },
    isDeleted: {
      type: 'boolean',
      defaultsTo: false,
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
