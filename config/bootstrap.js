/**
 * Seed Function
 * (sails.config.bootstrap)
 *
 * A function that runs just before your Sails app gets lifted.
 * > Need more flexibility?  You can also create a hook.
 *
 * For more information on seeding your app with fake data, check out:
 * https://sailsjs.com/config/bootstrap
 */

const _ = require('lodash');
const axios = require('axios');
const paystack = require('paystack');
const crypto = require('crypto');
const Raven = require('raven');
const ResponseHelper = require('@dsninjas/response');
const moment = require('moment');
const PubNub = require('pubnub');
const FirebaseAdmin = require('firebase-admin');

const capitalize = string => string.charAt(0).toUpperCase() + string.slice(1);

module.exports.bootstrap = async function(cb) {
  await FirebaseAdmin.initializeApp({
    credential: FirebaseAdmin.credential.cert(sails.config.custom.firebase),
    databaseURL: sails.config.custom.firebase.database_url,
  });

  global._ = _;
  global.Axios = axios;
  global.capitalize = capitalize;
  global.moment = moment;
  global.Paystack = paystack(sails.config.custom.paystack.secret_key);
  global.crypto = crypto;
  global.Raven = Raven;
  global.PubNub = new PubNub({
    ...sails.config.custom.pubnub,
    uuid: 'api',
  });
  global.FirebaseAdmin = FirebaseAdmin;
  process
    .on('unhandledRejection', (reason, p) => {
      // eslint-disable-next-line no-console
      console.error(reason, 'Unhandled Rejection at Promise', p);
    })
    .on('uncaughtException', err => {
      // eslint-disable-next-line no-console
      console.error(err, 'Uncaught Exception thrown');
      process.exit(1);
    });
  Raven.config(sails.config.custom.raven.configUrl).install();
  global.responseHelper = new ResponseHelper(Raven);
  cb();
};
