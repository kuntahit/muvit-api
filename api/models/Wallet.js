/**
 * Wallet.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */
const moment = require('moment');


module.exports = {
  attributes: {
    owner: {
      model: 'User',
    },
    balance: {
      type: 'number',
      defaultsTo: 0,
    },
    total_profit: {
      type: 'number',
      defaultsTo: 0,
    },
    cards: {
      collection: 'Card',
      via: 'wallet',
    },
    bank_accounts: {
      collection: 'BankAccount',
      via: 'wallet',
    },
    next_withdrawal: {
      type: 'string',
      defaultsTo: moment().add(1, 'w').toISOString(),
    }
  },
};
