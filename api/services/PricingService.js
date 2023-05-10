module.exports = {
  getDeliveryPrice(distance, return_trip) {
    const multiplier = return_trip ? 2 : 1;
    if (distance < 5000) return 500 * multiplier;
    return (500 + Math.ceil((distance - 5000) / 1000 * 50)) * multiplier;
  },

  getRidePrice(distance, return_trip) {
    const multiplier = return_trip ? 2 : 1;
    if (distance < 5000) return 500 * multiplier;
    return (100 + Math.ceil((distance - 5000) / 1000 * 50)) * multiplier;
  },
};
