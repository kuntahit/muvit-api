module.exports = {
  async newDeliverySlackNotify({
    firstname,
    lastname,
    location_pickup,
    location_delivery,
    name_pickup,
    name_delivery,
    phone_pickup,
    phone_delivery,
    payment_method,
    cash_payment_bearer,
    createdAt,
    return_trip,
    bill,
  }) {
    await Axios({
      url: sails.config.custom.slack.webhooks.deliveries.url,
      method: 'post',
      data: {
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*New Delivery Request*:\n${lastname} ${firstname}`,
            },
          },
          {
            type: 'section',
            fields: [
              {
                type: 'mrkdwn',
                text: `*Pickup Location:*\n${location_pickup.name} ${location_pickup.address}`,
              },
              {
                type: 'mrkdwn',
                text: `*Delivery Location:*\n${location_delivery.name} ${location_delivery.address}`,
              },
              {
                type: 'mrkdwn',
                text: `*Pickup Contact Name:*\n${name_pickup}`,
              },
              {
                type: 'mrkdwn',
                text: `*Delivery Contact Name:*\n${name_delivery}`,
              },
              {
                type: 'mrkdwn',
                text: `*Pickup Contact Phone:*\n${phone_pickup}`,
              },
              {
                type: 'mrkdwn',
                text: `*Delivery Contact Phone:*\n${phone_delivery}`,
              },
              {
                type: 'mrkdwn',
                text: `*Payment Method:*\n${capitalize(payment_method)} ${payment_method ===
                  'cash' && `(${capitalize(cash_payment_bearer)})`}`,
              },
              {
                type: 'mrkdwn',
                text: `*Bill:*\n₦ ${bill}`,
              },
              {
                type: 'mrkdwn',
                text: `*Payment Method:*\n${capitalize(payment_method)}`,
              },
              {
                type: 'mrkdwn',
                text: `*Return trip:*\n${return_trip}` ? 'Yes' : 'No',
              },
            ],
          },
          {
            type: 'context',
            elements: [
              {
                type: 'mrkdwn',
                text: moment(new Date(createdAt)).format('dddd, Do MMMM YYYY, h:mm:ss A'),
              },
            ],
          },
        ],
      },
    });
  },
  async newRideSlackNotify({
    location_origin,
    location_destination,
    firstname,
    lastname,
    createdAt,
    payment_method,
    return_trip,
    bill,
  }) {
    await Axios({
      url: sails.config.custom.slack.webhooks.rides.url,
      method: 'post',
      data: {
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*New Ride Request*:\n${lastname} ${firstname}`,
            },
          },
          {
            type: 'section',
            fields: [
              {
                type: 'mrkdwn',
                text: `*Current Location:*\n${location_origin.name} ${location_origin.address}`,
              },
              {
                type: 'mrkdwn',
                text: `*Destination:*\n${location_destination.name} ${location_destination.address}`,
              },
              {
                type: 'mrkdwn',
                text: `*Payment Method:*\n${capitalize(payment_method)}`,
              },
              {
                type: 'mrkdwn',
                text: `*Bill:*\n₦ ${bill}`,
              },
              {
                type: 'mrkdwn',
                text: `*Return trip:*\n${return_trip}` ? 'Yes' : 'No',
              },
            ],
          },
          {
            type: 'context',
            elements: [
              {
                type: 'mrkdwn',
                text: moment(new Date(createdAt)).format('dddd, Do MMMM YYYY, h:mm:ss A'),
              },
            ],
          },
        ],
      },
    });
  },
};
