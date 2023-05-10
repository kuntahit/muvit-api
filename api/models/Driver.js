/**
 * Driver.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
  attributes: {
    user: {
      model: 'User',
    },
    vehicle: {
      model: 'Vehicle',
    },
    status: {
      type: 'string',
      isIn: ['available', 'unavailable', 'engaged'],
      defaultsTo: 'unavailable',
    },
  },
};
