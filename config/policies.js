/**
 * Policy Mappings
 * (sails.config.policies)
 *
 * Policies are simple functions which run **before** your actions.
 *
 * For more information on configuring policies, check out:
 * https://sailsjs.com/docs/concepts/policies
 */

module.exports.policies = {
  /** *************************************************************************
   *                                                                          *
   * Default policy for all controllers and actions, unless overridden.       *
   * (`true` allows public access)                                            *
   *                                                                          *
   ************************************************************************** */

  // '*': true,

  UserController: {
    login: true,
    signup: true,
    read: ['isAuthorized'],
    changePassword: ['isAuthorized'],
  },

  DeviceController: {
    update: ['isAuthorized'],
  },

  TaskController: {
    create: ['isAuthorized'],
    getPricingInfo: ['isAuthorized'],
    list: ['isAuthorized'],
    confirmPayment: true,
  },

  RideController: {
    create: ['isAuthorized'],
    cancel: ['isAuthorized'],
    reject: ['isAuthorized'],
    accept: ['isAuthorized'],
    commence: ['isAuthorized'],
    end: ['isAuthorized'],
    getPricingInfo: ['isAuthorized'],
    list: ['isAuthorized'],
    read: ['isAuthorized'],
    confirmPayment: true,
  },

  DeliveriesController: {
    create: ['isAuthorized'],
    cancel: ['isAuthorized'],
    reject: ['isAuthorized'],
    accept: ['isAuthorized'],
    commence: ['isAuthorized'],
    end: ['isAuthorized'],
    getPricingInfo: ['isAuthorized'],
    list: ['isAuthorized'],
    read: ['isAuthorized'],
    // confirmPayment: true,
  },

  CardController: {
    initialize: ['isAuthorized'],
    list: ['isAuthorized'],
    create: ['isAuthorized'],
    // delete: ['isAuthorized'],
  },

  BankAccountController: {
    verify: ['isAuthorized'],
    create: ['isAuthorized'],
    list: ['isAuthorized'],
    listBanks: ['isAuthorized'],
  },

  LocationController: {
    create: ['isAuthorized'],
    list: ['isAuthorized'],
  },

  TransactionController: {
    list: ['isAuthorized'],
    getWallet: ['isAuthorized'],
    withdraw: ['isAuthorized'],
  },

  VehicleController: {
    create: ['isAuthorized'],
    read: ['isAuthorized'],
    update: ['isAuthorized'],
  },

  WalletController: {
    read: ['isAuthorized'],
  },
};
