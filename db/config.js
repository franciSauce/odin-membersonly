const { env } = require('node:process');

const { DB_USERNAME, DB_PASSWORD, DB_HOST, DB_PORT, DB_NAME, DB_CONNECTION_STRING } = env;

module.exports = {
  DB_USERNAME,
  DB_PASSWORD,
  DB_HOST,
  DB_PORT,
  DB_NAME,
  DB_CONNECTION_STRING
};