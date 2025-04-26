const allowedOrigins = [
  ...(process.env.FRONT_END_BASE_URLS ? process.env.FRONT_END_BASE_URLS.split(',').map(url => url.trim()): [])
];

module.exports = allowedOrigins