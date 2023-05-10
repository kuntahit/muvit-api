/**
 * Card.js
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
    wallet: {
      model: 'Wallet',
    },
    email: {
      type: 'string',
    },
    authorization_code: {
      type: 'string',
    },
    card_type: {
      type: 'string',
    },
    last4: {
      type: 'string',
    },
    exp_month: {
      type: 'string',
    },
    exp_year: {
      type: 'string',
    },
    bin: {
      type: 'string',
    },
    bank: {
      type: 'string',
    },
    channel: {
      type: 'string',
    },
    signature: {
      type: 'string',
    },
    reusable: {
      type: 'boolean',
    },
    country_code: {
      type: 'string',
    },
    isDeleted: {
      type: 'boolean',
      defaultsTo: false,
    },
  },
};
