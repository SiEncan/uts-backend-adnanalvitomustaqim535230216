const mongoose = require('mongoose');
const config = require('../core/config');
const logger = require('../core/logger')('app');

const usersSchema = require('./users-schema');
const FailedLoginAttemptSchema = require('./failed_login-schema');
const BankAccountSchema = require('./bank_account-schema');

mongoose.connect(`${config.database.connection}/${config.database.name}`, {
  useNewUrlParser: true,
});

const db = mongoose.connection;
db.once('open', () => {
  logger.info('Successfully connected to MongoDB');
});

const User = mongoose.model('users', mongoose.Schema(usersSchema));

const FailedLoginAttempt = mongoose.model(
  'FailedLoginAttempt',
  mongoose.Schema(FailedLoginAttemptSchema)
);

const BankAccount = mongoose.model(
  'BankAccount',
  mongoose.Schema(BankAccountSchema)
);

module.exports = {
  mongoose,
  User,
  FailedLoginAttempt,
  BankAccount,
};
