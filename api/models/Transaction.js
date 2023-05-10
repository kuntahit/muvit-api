/* eslint-disable no-param-reassign */
/**
 * Transaction.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
  attributes: {
    type: {
      type: 'string',
      isIn: ['credit', 'debit'],
    },
    user: {
      model: 'User',
    },
    ride: {
      model: 'Ride',
    },
    delivery: {
      model: 'Delivery',
    },
    bank_account: {
      model: 'BankAccount',
    },
    card: {
      model: 'Card',
    },
    amount: {
      type: 'number',
      required: true,
    },
    destination: {
      type: 'string',
      isIn: ['muvit', 'wallet', 'bank-account'],
      defaultsTo: 'muvit',
    },
    reference: {
      type: 'string',
      allowNull: true,
    },
    code: {
      type: 'string',
    },
    description: {
      type: 'string',
      required: true,
    },
    status: {
      type: 'string',
      isIn: ['pending', 'successful', 'failed', 'in-progress'],
      defaultsTo: 'pending',
    },
    currency: {
      type: 'string',
      isIn: ['NGN', 'USD'],
      defaultsTo: 'NGN',
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
