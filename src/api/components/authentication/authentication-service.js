const authenticationRepository = require('./authentication-repository');
const { generateToken } = require('../../../utils/session-token');
const { passwordMatched } = require('../../../utils/password');

/**
 * Check username and password for login.
 * @param {string} email - Email
 * @param {string} password - Password
 * @returns {object} An object containing, among others, the JWT token if the email and password are matched. Otherwise returns null.
 */
async function checkLoginCredentials(email, password) {
  const user = await authenticationRepository.getUserByEmail(email);

  // We define default user password here as '<RANDOM_PASSWORD_FILTER>'
  // to handle the case when the user login is invalid. We still want to
  // check the password anyway, so that it prevents the attacker in
  // guessing login credentials by looking at the processing time.
  const userPassword = user ? user.password : '<RANDOM_PASSWORD_FILLER>';
  const passwordChecked = await passwordMatched(password, userPassword);

  // Because we always check the password (see above comment), we define the
  // login attempt as successful when the `user` is found (by email) and
  // the password matches.
  if (user && passwordChecked) {
    return {
      email: user.email,
      name: user.name,
      user_id: user.id,
      token: generateToken(user.email, user.id),
    };
  }

  return null;
}

/**
 * Check email validity
 * @param {string} email - Email
 * @returns {Promis}
 */
async function isEmailValid(email) {
  const user = await authenticationRepository.getUserByEmail(email);

  if (!user) return null;

  return user;
}

/**
 * Get user failed login attempt detail
 * @param {string} email - User Email
 * @returns {Object}
 */
async function getFailedLoginAttempt(email) {
  const FailedLoginAttempt =
    await authenticationRepository.getFailedLoginAttempt(email);

  // Failed Login Attempt not found (belum pernah mencoba gagal login)
  if (!FailedLoginAttempt) {
    return null;
  }

  return {
    id: FailedLoginAttempt.id,
    email: FailedLoginAttempt.email,
    timestamp: FailedLoginAttempt.timestamp,
    count: FailedLoginAttempt.count,
  };
}

/**
 * Create failed login attempt
 * @param {string} email - User Email
 * @returns {Promise}
 */
async function createFailedLoginAttempt(email) {
  try {
    // Buat data catatan percobaan login gagal
    await authenticationRepository.createFailedLoginAttempt(email);
  } catch (error) {
    console.error('Error creating failed login attempt:', error);
    throw error;
  }
}

/**
 * Count failed login attempt
 * @param {string} email - User Email
 * @returns {Promise}
 */
async function countFailedLoginAttempt(email) {
  try {
    // Menaikkan nilai failedlogin count dan mencatat waktu failedlogin untuk email tertentu
    await authenticationRepository.updateFailedLoginAttempt(email);
  } catch (error) {
    console.error('Error counting failed login attempt:', error);
    throw error;
  }
}

/**
 * Check failed login limit time
 * @param {number} LIMIT_TIME
 * @param {object} timestamp
 * @returns {Promise}
 */
async function checkLimitTime(LIMIT_TIME, timestamp) {
  try {
    // limit end = waktu timestamp + 30 menit
    const limitEnd = new Date(timestamp.getTime() + LIMIT_TIME * 60000);
    const currentTime = new Date();

    // jika waktu saat ini melewati limit end
    if (currentTime > limitEnd) {
      return true;
    }
  } catch (error) {
    console.error('Error checking limit time:', error);
    throw error;
  }
}

/**
 * Reset failed login attempt
 * @param {string} email - User Email
 * @returns {Promise}
 */
async function resetFailedLoginAttempt(email) {
  try {
    // Hapus semua data percobaan login gagal untuk email tersebut
    await authenticationRepository.deleteFailedLoginAttempt(email);
  } catch (error) {
    console.error('Error resetting failed login attempts:', error);
    throw error;
  }
}

module.exports = {
  checkLoginCredentials,
  isEmailValid,
  checkLimitTime,
  createFailedLoginAttempt,
  countFailedLoginAttempt,
  resetFailedLoginAttempt,
  getFailedLoginAttempt,
};
