const { User } = require('../../../models');
const { FailedLoginAttempt } = require('../../../models/');

/**
 * Get user by email for login information
 * @param {string} email - Email
 * @returns {Promise}
 */
async function getUserByEmail(email) {
  return User.findOne({ email });
}

/**
 * Get failed login attempt by email
 * @param {string} email - Email
 * @returns {Promise}
 */
async function getFailedLoginAttempt(email) {
  return FailedLoginAttempt.findOne({ email });
}

/**
 * Create new failed login attempt
 * @param {string} email - Email
 * @returns {Promise}
 */
async function createFailedLoginAttempt(email) {
  return FailedLoginAttempt.create({
    email,
    timestamp: new Date(),
    count: 1,
  });
}

/**
 * Update existing failed login attempt count with new timestamp
 * @param {string} email - Email
 * @returns {Promise}
 */
async function updateFailedLoginAttempt(email) {
  return FailedLoginAttempt.updateOne(
    { email },
    { $inc: { count: 1 }, $set: { timestamp: new Date() } }
  );
}

/**
 * Delete existing failed login attempt
 * @param {string} email - User Email
 * @returns {Promise}
 */
async function deleteFailedLoginAttempt(email) {
  return FailedLoginAttempt.deleteOne({ email });
}

module.exports = {
  getUserByEmail,
  getFailedLoginAttempt,
  createFailedLoginAttempt,
  updateFailedLoginAttempt,
  deleteFailedLoginAttempt,
};
