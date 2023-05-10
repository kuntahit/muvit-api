module.exports = {
  port: process.env.PORT || 1337,
  secret: process.env.APP_SECRET,
  datastores: {
    mongo: {
      adapter: require('sails-mongo'),
      url: process.env.MONGO_URL,
    },
  },
  models: {
    datastore: 'mongo',
    migrate: 'safe',
  },
  custom: {
    firebase: { database_url: process.env.FIREBASE_DATABASE_URL, ...JSON.parse(process.env.FIREBASE_CONFIG) },
    paystack: {
      secret_key: process.env.PAYSTACK_SECRET_KEY,
      public_key: process.env.PAYSTACK_PUBLIC_KEY,
    },
    pubnub: {
      publishKey: process.env.PUBNUB_PUBLISH_KEY,
      subsribeKey: process.env.PUBNUB_SUBSCRIBE_KEY,
      secretKey: process.env.PUBNUB_SECRET_KEY,
    },
    raven: {
      configUrl: process.env.RAVEN_CONFIG_URL,
    },
    googleCloud: {
      api_key: process.env.GOOGLE_CLOUD_API_KEY,
    },
    slack: {
      webhooks: {
        deliveries: {
          url: process.env.SLACK_WEBHOOK_DELIVERIES_URL,
        },
        rides: {
          url: process.env.SLACK_WEBHOOK_RIDES_URL,
        },
      },
    },
  },
  blueprints: {
    rest: false,
    actions: false,
    shortcuts: false,
  },
  session: {
    cookie: {
      secure: true,
    },
  },
  sockets: {
    onlyAllowOrigins: [],
  },
  settings: {
    raven: {
      configUrl: process.env.RAVEN_CONFIG_URL,
    },
  },
  security: {
    cors: {
      allRoutes: true,
      allowOrigins: '*',
      allowCredentials: false,
    },
  },
};
