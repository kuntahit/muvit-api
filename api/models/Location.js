/**
 * Location.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

const moment = require('moment');

module.exports = {
  attributes: {
    user: {
      model: 'User',
    },
    device: {
      model: 'Device',
    },
    geo_coordinates: {
      type: 'json',
      required: true,
    },
    date_time: {
      type: 'string',
      defaultsTo: moment().toISOString(),
    },
  },
};
