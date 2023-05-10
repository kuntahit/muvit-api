module.exports = {
  async getDistanceByPlaceID(placeID_start, placeID_end) {
    const {
      data: { rows },
    } = await Axios({
      url: 'https://maps.googleapis.com/maps/api/distancematrix/json',
      method: 'get',
      params: {
        origins: `place_id:${placeID_start}`,
        destinations: `place_id:${placeID_end}`,
        units: 'metric',
        key: sails.config.custom.googleCloud.api_key,
      },
    });
    const { distance, duration } = rows[0].elements[0];
    return { distance, duration };
  },

  async getDistanceByGeoCoordinates(coordinates_start, coordinates_end) {
    const {
      data: { rows },
    } = await Axios({
      url: 'https://maps.googleapis.com/maps/api/distancematrix/json',
      method: 'get',
      params: {
        origins: coordinates_start.join(),
        destinations: coordinates_end.join(),
        units: 'metric',
        key: sails.config.custom.googleCloud.api_key,
      },
    });
    const { distance, duration } = rows[0].elements[0];
    return { distance, duration };
  },
};
