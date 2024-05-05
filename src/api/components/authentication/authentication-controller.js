const { errorResponder, errorTypes } = require('../../../core/errors');
const authenticationServices = require('./authentication-service');

// Batas waktu dalam menit untuk membatasi user login kembali
const LIMIT_TIME = 30;
// Batas maksimum percobaan login gagal
const MAX_FAILED_ATTEMPTS = 5;

/**
 * Handle login request
 * @param {object} request - Express request object
 * @param {object} response - Express response object
 * @param {object} next - Express route middlewares
 * @returns {object} Response object or pass an error to the next route
 */
async function login(request, response, next) {
  const { email, password } = request.body;

  try {
    // ambil data percobaan login gagal dengan email
    let failedLoginAttempt =
      await authenticationServices.getFailedLoginAttempt(email);

    // jika sudah ada catatan login gagal
    if (failedLoginAttempt) {
      // Periksa waktu limit akun
      isLimitEnd = await authenticationServices.checkLimitTime(
        LIMIT_TIME,
        failedLoginAttempt.timestamp
      );

      // reset jika sudah expired
      if (isLimitEnd)
        await authenticationServices.resetFailedLoginAttempt(email);

      // memperbarui failedLoginAttempt setelah melakukan cek limit time and resetting attempt
      failedLoginAttempt =
        await authenticationServices.getFailedLoginAttempt(email);
    }

    // jika failedLoginAttempt ada dan percobaannya melebihi batas
    if (failedLoginAttempt && failedLoginAttempt.count >= MAX_FAILED_ATTEMPTS) {
      throw errorResponder(
        errorTypes.FORBIDDEN,
        'Too many failed login attempts.'
      );
    }

    // Check login credentials
    const loginSuccess = await authenticationServices.checkLoginCredentials(
      email,
      password
    );

    // login gagal
    if (!loginSuccess) {
      // cek dahulu, login gagal tetapi apakah email valid?
      const emailValid = await authenticationServices.isEmailValid(email);

      // Catat percobaan login gagal
      if (failedLoginAttempt) {
        // jika failedLoginAttempt sudah ada sebelumnya, maka tambahkan attemptnya
        await authenticationServices.countFailedLoginAttempt(email);

        // Cek jika email valid buat failedloginattempt, tetapi jika tidak valid tidak perlu dibuat
      } else if (!failedLoginAttempt && emailValid) {
        // jika failedLoginAttempt belum ada, maka buat failedLoginAttempt
        await authenticationServices.createFailedLoginAttempt(email);
      }
      throw errorResponder(
        errorTypes.INVALID_CREDENTIALS,
        `Wrong email or password`
      );
    }

    // jika login berhasil dan mempunyai data failedLoginAttempt maka reset attemptnya
    if (failedLoginAttempt)
      await authenticationServices.resetFailedLoginAttempt(email);

    return response.status(200).json(loginSuccess);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  login,
};
