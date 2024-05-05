const mainAppService = require('./mainApp-service');
const usersService = require('../users/users-service');
const { errorResponder, errorTypes } = require('../../../core/errors');

/**
 * Handle create user pin
 * @param {object} request - Express request object
 * @param {object} response - Express response object
 * @param {object} next - Express route middlewares
 * @returns {object} Response object or pass an error to the next route
 */
async function createPin(request, response, next) {
  try {
    const id = request.params.id;
    const pin = request.body.pin;
    const pin_confirm = request.body.pin_confirm;

    // cek pin dengan konfirmasi pin
    if (pin !== pin_confirm) {
      throw errorResponder(
        errorTypes.INVALID_PASSWORD,
        'Pin confirmation mismatched'
      );
    }

    const idRegistered = await mainAppService.getBankAccountbyId(id);
    // apakah id sudah terdaftar, jika true maka throw error responder
    if (idRegistered) {
      throw errorResponder(
        errorTypes.PASSCODE_ALREADY_EXIST,
        'You cant create 2 pin'
      );
    }

    // membuat account number dengan random
    const accountNumber = mainAppService.generateRandomAccountNumber();

    const success = await mainAppService.createPin(id, accountNumber, pin);
    if (!success) {
      throw errorResponder(
        errorTypes.UNPROCESSABLE_ENTITY,
        'Failed to create pin'
      );
    }

    return response.status(200).json({ accountNumber, pin });
  } catch (error) {
    return next(error);
  }
}

/**
 * Handle user deposit balanace
 * @param {object} request - Express request object
 * @param {object} response - Express response object
 * @param {object} next - Express route middlewares
 * @returns {object} Response object or pass an error to the next route
 */
async function depositBalance(request, response, next) {
  try {
    const accountNumber = request.body.accountNumber;
    const amount = request.body.amount;
    const pin = request.body.pin;

    const bankAccount = await mainAppService.getBankAccount(accountNumber);
    // akun tidak ada
    if (!bankAccount) {
      throw errorResponder(
        errorTypes.INVALID_CREDENTIALS,
        'Invalid Account Number'
      );
    }

    // Check pin
    if (!(await mainAppService.checkPin(accountNumber, pin))) {
      throw errorResponder(errorTypes.INVALID_CREDENTIALS, 'Wrong pin');
    }

    const success = await mainAppService.updateBalance(accountNumber, amount);
    if (!success) {
      throw errorResponder(
        errorTypes.UNPROCESSABLE_ENTITY,
        'Failed to add balance'
      );
    }

    // buat histori transaksi dengan tipe Deposit
    await mainAppService.createTransactionHistory(
      accountNumber,
      amount,
      'Deposit'
    );

    // ambil info akun setelah deposit untuk melihat balance
    const accountInfo = await mainAppService.getBankAccount(accountNumber);
    return response.status(200).json({ Balance: accountInfo.balance });
  } catch (error) {
    return next(error);
  }
}

/**
 * Handle user withdraw balanace
 * @param {object} request - Express request object
 * @param {object} response - Express response object
 * @param {object} next - Express route middlewares
 * @returns {object} Response object or pass an error to the next route
 */
async function withdrawBalance(request, response, next) {
  try {
    const accountNumber = request.body.accountNumber;
    const amount = request.body.amount;
    const pin = request.body.pin;

    const bankAccount = await mainAppService.getBankAccount(accountNumber);
    // akun tidak ada
    if (!bankAccount) {
      throw errorResponder(
        errorTypes.INVALID_CREDENTIALS,
        'Invalid Account Number'
      );
    }

    // Check pin
    if (!(await mainAppService.checkPin(accountNumber, pin))) {
      throw errorResponder(errorTypes.INVALID_CREDENTIALS, 'Wrong pin');
    }

    // Cek balance apakah cukup
    let accountInfo = await mainAppService.getBankAccount(accountNumber);
    if (accountInfo.balance < amount) {
      throw errorResponder(
        errorTypes.INSUFFUCIENT_BALANCE,
        'Your balance is low'
      );
    }

    const success = await mainAppService.updateBalance(accountNumber, -amount);
    if (!success) {
      throw errorResponder(
        errorTypes.UNPROCESSABLE_ENTITY,
        'Failed to withdraw balance'
      );
    }

    // buat histori transaksi dengan tipe Withdraw
    await mainAppService.createTransactionHistory(
      accountNumber,
      amount,
      'Withdraw'
    );

    // ambil info akun setelah deposit untuk melihat balance
    accountInfo = await mainAppService.getBankAccount(accountNumber);
    return response.status(200).json({ Balance: accountInfo.balance });
  } catch (error) {
    return next(error);
  }
}

/**
 * Handle user transfer balanace
 * @param {object} request - Express request object
 * @param {object} response - Express response object
 * @param {object} next - Express route middlewares
 * @returns {object} Response object or pass an error to the next route
 */
async function transferBalance(request, response, next) {
  try {
    const accountNumber_sender = request.body.accountNumber;
    const accountNumber_recipient = request.body.accountNumber_recipient;
    const amount = request.body.amount;
    const pin = request.body.pin;

    let bankAccount_sender =
      await mainAppService.getBankAccount(accountNumber_sender);

    // akun pengirim tidak ada
    if (!bankAccount_sender) {
      throw errorResponder(
        errorTypes.INVALID_CREDENTIALS,
        'Invalid Account Number'
      );
    }

    let bankAccount_recipient = await mainAppService.getBankAccount(
      accountNumber_recipient
    );

    // akun penerima tidak ada
    if (!bankAccount_recipient) {
      throw errorResponder(
        errorTypes.INVALID_CREDENTIALS,
        'Invalid Recipient Account Number'
      );
    }

    // Check pin
    if (!(await mainAppService.checkPin(accountNumber_sender, pin))) {
      throw errorResponder(errorTypes.INVALID_CREDENTIALS, 'Wrong pin');
    }

    // Cek balance apakah cukup
    if (bankAccount_sender.balance < amount) {
      throw errorResponder(
        errorTypes.INSUFFUCIENT_BALANCE,
        'Your balance is low'
      );
    }

    const success = await mainAppService.transferBalance(
      accountNumber_sender,
      accountNumber_recipient,
      amount
    );
    if (!success) {
      throw errorResponder(
        errorTypes.UNPROCESSABLE_ENTITY,
        'Failed to transfer balance'
      );
    }

    // Menyusun objek yang akan digunakan sebagai detail transaksi
    const sender = await usersService.getUser(bankAccount_sender.id);
    const recipient = await usersService.getUser(bankAccount_recipient.id);
    const accountGroup = {
      accountNumber_sender,
      accountNumber_recipient,
      name_sender: sender.name,
      name_recipient: recipient.name,
    };

    // buat histori transaksi dengan tipe Transfer
    await mainAppService.createTransactionHistory(
      accountGroup,
      amount,
      'Transfer'
    );

    // ambil info akun setelah deposit untuk melihat balance
    bankAccount_sender =
      await mainAppService.getBankAccount(accountNumber_sender);
    return response.status(200).json({ Balance: bankAccount_sender.balance });
  } catch (error) {
    return next(error);
  }
}

/**
 * Handle get user detail request
 * @param {object} request - Express request object
 * @param {object} response - Express response object
 * @param {object} next - Express route middlewares
 * @returns {object} Response object or pass an error to the next route
 */
async function getAccountInfo(request, response, next) {
  try {
    const id = request.params.id;

    const bankAccount = await mainAppService.getBankAccountbyId(id);
    // akun tidak ada
    if (!bankAccount) {
      throw errorResponder(
        errorTypes.INVALID_CREDENTIALS,
        'Invalid Account Number'
      );
    }
    // mengambil name dan email dari user menggunakan id
    const user = await usersService.getUser(id);

    // return info akun
    return response.status(200).json({
      name: user.name,
      email: user.email,
      accountNumber: bankAccount.accountNumber,
      balance: bankAccount.balance,
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * Handle get list of users request
 * @param {object} request - Express request object
 * @param {object} response - Express response object
 * @param {object} next - Express route middlewares
 * @returns {object} Response object or pass an error to the next route
 */
async function getTransactionHistory(request, response, next) {
  try {
    // Mendapatkan parameter dari query string
    const accountNumber = request.params.accountNumber;
    const { page_number, page_size, search, sort } = request.query;

    // Menyusun objek yang akan digunakan sebagai parameter untuk memanggil service
    const queryParams = {};

    // Menambahkan parameter ke queryParams hanya jika mereka diberikan dalam query string
    if (page_number) queryParams.pageNumber = parseInt(page_number);
    if (page_size) queryParams.pageSize = parseInt(page_size);
    if (search) {
      // Mengecek apakah search adalah string tunggal atau array
      const searchFilters = Array.isArray(search) ? search : [search];

      // jika array, ambil index pertama
      [queryParams.searchFieldName, queryParams.searchKey] =
        searchFilters[0].split(':'); // split search query
    }
    if (sort) {
      // Mengecek apakah sort adalah string tunggal atau array
      const sortings = Array.isArray(sort) ? sort : [sort];

      // jika array, ambil index pertama
      [queryParams.sortFieldName, queryParams.sortOrder] =
        sortings[0].split(':'); // split sort query
    }

    const bankAccount = await mainAppService.getBankAccount(accountNumber);

    // akun tidak ada
    if (!bankAccount) {
      throw errorResponder(
        errorTypes.INVALID_CREDENTIALS,
        'Invalid Account Number'
      );
    }

    // jika query pageNumber/pageSize kurang dari 1 maka tidak valid
    if (queryParams.pageNumber < 1 || queryParams.pageSize < 1) {
      throw errorResponder(
        errorTypes.VALIDATION,
        'Page number/Page size tidak valid'
      );
    }

    // Panggil service untuk mendapatkan list transaction history pengguna dengan parameter yang sesuai
    const transactionHistory = await mainAppService.getTransactionHistory(
      accountNumber,
      queryParams
    );

    // jika pageNumber query melebihi total pages maka menampilkan error page kosong
    if (
      queryParams.pageNumber > transactionHistory.total_pages ||
      !transactionHistory.total_pages
    )
      throw errorResponder(errorTypes.VALIDATION, 'Page Kosong');

    // Mengirimkan respons dengan list transaction history yang telah difilter dan disort
    return response.status(200).json(transactionHistory);
  } catch (error) {
    return next(error);
  }
}

/**
 * Handle change user pin request
 * @param {object} request - Express request object
 * @param {object} response - Express response object
 * @param {object} next - Express route middlewares
 * @returns {object} Response object or pass an error to the next route
 */
async function changePin(request, response, next) {
  try {
    const accountNumber = request.params.accountNumber;
    const bankAccount = await mainAppService.getBankAccount(accountNumber);

    // akun tidak ada
    if (!bankAccount) {
      throw errorResponder(
        errorTypes.INVALID_CREDENTIALS,
        'Invalid Account Number'
      );
    }
    // Check pin confirmation
    if (request.body.pin_new !== request.body.pin_confirm) {
      throw errorResponder(
        errorTypes.INVALID_PASSWORD,
        'Pin confirmation mismatched'
      );
    }

    // Check old pin
    if (!(await mainAppService.checkPin(accountNumber, request.body.pin))) {
      throw errorResponder(errorTypes.INVALID_CREDENTIALS, 'Wrong pin');
    }

    const changeSuccess = await mainAppService.changePin(
      accountNumber,
      request.body.pin_new
    );

    if (!changeSuccess) {
      throw errorResponder(
        errorTypes.UNPROCESSABLE_ENTITY,
        'Failed to change pin'
      );
    }

    // return account number dan pin baru
    return response.status(200).json({
      accountNumber: accountNumber,
      newPin: request.body.pin_new,
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * Handle delete user account request
 * @param {object} request - Express request object
 * @param {object} response - Express response object
 * @param {object} next - Express route middlewares
 * @returns {object} Response object or pass an error to the next route
 */
async function deleteAccount(request, response, next) {
  try {
    const accountNumber = request.params.accountNumber;

    const success = await mainAppService.deleteAccount(accountNumber);
    if (!success) {
      throw errorResponder(
        errorTypes.UNPROCESSABLE_ENTITY,
        'Failed to delete account'
      );
    }

    return response.status(200).json({ accountNumber });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  createPin,
  depositBalance,
  withdrawBalance,
  transferBalance,
  getAccountInfo,
  getTransactionHistory,
  changePin,
  deleteAccount,
};
