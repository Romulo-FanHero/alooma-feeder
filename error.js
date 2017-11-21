// dependencies
var winston = require('winston');
const winstonError = require('winston-error');

// overwrite default logger
winston.level = process.env.WINSTON_LEVEL || 'error';
winston.add(winston.transports.File, { filename: 'error.log' });
winstonError(winston);

// return default error handling function for the whole project
module.exports = err => err ? winston.error(err) : null;
