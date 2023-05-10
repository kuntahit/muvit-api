/**
 * Vehicle.js
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
    type: {
      type: 'string',
      isIn: ['bike', 'car', 'pickup'],
      defaultsTo: 'bike',
    },
    color: {
      type: 'string',
      defaultsTo: 'blue'
    },
    plate_number: {
      type: 'string',
      required: true,
    },
    brand: {
      type: 'string',
      required: true,
    },
    model: {
      type: 'string',
      required: true,
    },
    isDeleted: {
      type: 'boolean',
      defaultsTo: false,
    },
  },
};
