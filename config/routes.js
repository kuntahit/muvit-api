/**
 * Route Mappings
 * (sails.config.routes)
 *
 * Your routes tell Sails what to do each time it receives a request.
 *
 * For more information on configuring custom routes, check out:
 * https://sailsjs.com/anatomy/config/routes-js
 */

module.exports.routes = {
  // Auth
  'POST /user/signup': {
    controller: 'UserController',
    action: 'signup',
  },
  'POST /user/login': {
    controller: 'UserController',
    action: 'login',
  },
  'POST /user/change-password': {
    controller: 'UserController',
    action: 'changePassword',
  },
  'GET /user': {
    controller: 'UserController',
    action: 'read',
  },

  // Device
  'PATCH /device/:id': {
    controller: 'DeviceController',
    action: 'update',
  },

  // Deliveries
  'POST /delivery': {
    controller: 'DeliveriesController',
    action: 'create',
  },
  'PUT /delivery/reject/:id': {
    controller: 'DeliveriesController',
    action: 'reject',
  },
  'PUT /delivery/cancel/:id': {
    controller: 'DeliveriesController',
    action: 'cancel',
  },
  'PUT /delivery/accept/:id': {
    controller: 'DeliveriesController',
    action: 'accept',
  },
  'PUT /delivery/commence/:id': {
    controller: 'DeliveriesController',
    action: 'commence',
  },
  'PUT /delivery/end/:id': {
    controller: 'DeliveriesController',
    action: 'end',
  },
  'GET /delivery/:id': {
    controller: 'DeliveriesController',
    action: 'read',
  },
  'GET /delivery': {
    controller: 'DeliveriesController',
    action: 'list',
  },
  'POST /delivery/info': {
    controller: 'DeliveriesController',
    action: 'getPricingInfo',
  },

  // Rides
  'POST /ride': {
    controller: 'RideController',
    action: 'create',
  },
  'PUT /ride/cancel/:id': {
    controller: 'RideController',
    action: 'cancel',
  },
  'PUT /ride/reject/:id': {
    controller: 'RideController',
    action: 'reject',
  },
  'PUT /ride/accept/:id': {
    controller: 'RideController',
    action: 'accept',
  },
  'PUT /ride/commence/:id': {
    controller: 'RideController',
    action: 'commence',
  },
  'PUT /ride/end/:id': {
    controller: 'RideController',
    action: 'end',
  },
  'GET /ride/:id': {
    controller: 'RideController',
    action: 'read',
  },
  'GET /ride': {
    controller: 'RideController',
    action: 'list',
  },
  'POST /ride/info': {
    controller: 'RideController',
    action: 'getPricingInfo',
  },

  // Cards
  'GET /card/initialize': {
    controller: 'CardController',
    action: 'initialize',
  },
  'POST /card': {
    controller: 'CardController',
    action: 'create',
  },
  'GET /cards': {
    controller: 'CardController',
    action: 'list',
  },

  // Bank Accounts
  'POST /bank-account/verify': {
    controller: 'BankAccountController',
    action: 'verify',
  },
  'POST /bank-account': {
    controller: 'BankAccountController',
    action: 'create',
  },
  'GET /bank-account': {
    controller: 'BankAccountController',
    action: 'list',
  },
  'GET /bank-list': {
    controller: 'BankAccountController',
    action: 'listBanks',
  },

  // Locations
  'POST /location': {
    controller: 'LocationController',
    action: 'create',
  },
  'POST /location/list': {
    controller: 'LocationController',
    action: 'list',
  },

  // Transactions
  'GET /transaction': {
    controller: 'TransactionController',
    action: 'list',
  },
  'GET /transaction/wallet': {
    controller: 'TransactionController',
    action: 'getWallet',
  },
  'POST /transaction/withdraw': {
    controller: 'TransactionController',
    action: 'withdraw',
  },

  // Vehicle
  'POST /vehicle': {
    controller: 'VehicleController',
    action: 'create',
  },
  'PATCH /vehicle/:id': {
    controller: 'VehicleController',
    action: 'update',
  },
  'GET /vehicle': {
    controller: 'VehicleController',
    action: 'read',
  },

  // Wallet
  'GET /wallet': {
    controller: 'WalletController',
    action: 'read',
  }
};
