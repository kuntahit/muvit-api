/**
 * BankAccount.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
  attributes: {
    user: {
      model: 'User',
    },
    wallet: {
      model: 'Wallet',
    },
    account_number: {
      type: 'string',
      required: true,
    },
    account_name: {
      type: 'string',
      required: true,
    },
    bank_code: {
      type: 'string',
      required: true,
    },
    bank_name: {
      type: 'string',
      required: true,
    },
    recipient_code: {
      type: 'string',
      required: true,
    },
    isDeleted: {
      type: 'boolean',
      defaultsTo: false,
    },
  },
};
