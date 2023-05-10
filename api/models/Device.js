/**
 * Device.js
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
    fcm_token: {
      type: 'string',
      allowNull: true,
    },
    imei: {
      type: 'string',
      allowNull: true,
    },
    manufacturer: {
      type: 'string',
      allowNull: true,
    },
    model: {
      type: 'string',
      allowNull: true,
    },
    os: {
      type: 'string',
      allowNull: true,
    },
    os_version: {
      type: 'string',
      allowNull: true,
    },
    os_api_level: {
      type: 'string',
      allowNull: true,
    },
    uuid: {
      type: 'string',
      allowNull: true,
    },
  },
};
