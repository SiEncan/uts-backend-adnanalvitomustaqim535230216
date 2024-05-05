const mainAppRepository = require('./mainApp-repository');
const {
  hashPin,
  passwordMatched,
  hashPassword,
} = require('../../../utils/password');

/**
 * Create new pin
 * @param {string} id - User Id
 * @param {string} accountNumber - Account Number
 * @param {string} pin - Pin
 * @returns {boolean}
 */
async function createPin(id, accountNumber, pin) {
  const hashedPin = await hashPin(pin);

  try {
    await mainAppRepository.createPin(id, accountNumber, hashedPin);
  } catch (err) {
    return null;
  }

  return true;
}

/**
 * Delete user account
 * @param {string} accountNumber - User Account Number
 * @returns {boolean}
 */
async function deleteAccount(accountNumber) {
  const bankAccount =
    await mainAppRepository.getAccountByAccountNumber(accountNumber);

  // Account not found
  if (!bankAccount) {
    return null;
  }

  try {
    await mainAppRepository.deleteAccount(accountNumber);
  } catch (err) {
    return null;
  }

  return true;
}

/**
 * Get Bank Account Detail
 * @param {string} accountNumber - User Account Number
 * @returns {Object}
 */
async function getBankAccount(accountNumber) {
  let bankAccount =
    await mainAppRepository.getAccountByAccountNumber(accountNumber);

  // Account not found
  if (!bankAccount) {
    return null;
  }

  return {
    id: bankAccount.id,
    accountNumber: bankAccount.accountNumber,
    balance: bankAccount.balance,
  };
}

/**
 * Get Bank Account Detail With Id
 * @param {string} id - User Id
 * @returns {Object}
 */
async function getBankAccountbyId(id) {
  let bankAccount = await mainAppRepository.getAccountById(id);

  // Bank Account not found
  if (!bankAccount) {
    return null;
  }

  return {
    id: bankAccount.id,
    accountNumber: bankAccount.accountNumber,
    balance: bankAccount.balance,
  };
}

/**
 * Get list of transaction history
 * @param {string} queryParams - Query Parameter for Pagination, Sorting, and Search
 * @returns {Object}
 */
async function getTransactionHistory(accountNumber, queryParams) {
  // cek apakah format sort dan search valid
  const { validSort, validSearch } = validateQueryParams(queryParams);

  // ambil data bank account user
  const bankAccount =
    await mainAppRepository.getAccountByAccountNumber(accountNumber);

  // ambil transaction historynya saja
  let transactionHistory = bankAccount.transactionHistory;

  // search
  const filteredHistory = validSearch
    ? searchHistory(transactionHistory, queryParams)
    : transactionHistory; // jika tidak diisi, defaultnya semua data transaksi

  // sorting
  const sortedHistory = validSort
    ? sortHistory(filteredHistory, queryParams)
    : sortHistory(filteredHistory, {
        sortOrder: 'desc',
        sortFieldName: 'date', // jika tidak diisi, defaultnya descending berdasarkan tanggal
      });

  // Pagination
  const { pageSize, pageNumber, startIndex, endIndex, totalPage } =
    paginateHistory(
      queryParams.pageNumber,
      queryParams.pageSize,
      sortedHistory.length
    );

  // membuat option untuk convert timestamp menjadi date yang lebih enak dibaca
  const options = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
  };

  const results = [];

  // memasukkan semua transaction history yang sudah difilter ke dalam results
  for (let i = startIndex; i < endIndex; i++) {
    const history = sortedHistory[i];
    results.push({
      type: history.type,
      amount: history.amount,
      recipientId: history.recipientId,
      recipientName: history.recipientName,
      senderId: history.senderId,
      senderName: history.senderName,
      timestamp: history.timestamp.toLocaleString('en', options), // convert timestamp
      transaction_id: history._id,
    });
  }

  return {
    page_number: pageNumber,
    page_size: pageSize,
    total_pages: totalPage,
    count: sortedHistory.length,
    has_previous_page: pageNumber > 1,
    has_next_page: pageNumber < totalPage && totalPage > 1,
    data: results,
  };
}

/**
 * Check whether the pin is correct
 * @param {string} id - User ID
 * @param {string} pin - Pin
 * @returns {boolean}
 */
async function checkPin(accountNumber, pin) {
  const bankAccount =
    await mainAppRepository.getAccountByAccountNumber(accountNumber);
  pin = pin.toString();
  return passwordMatched(pin, bankAccount.pin);
}

/**
 * Validate Query Params
 * @param {string} queryParams - Query Parameter for Pagination, Sorting, and Search
 * @returns {boolean}
 */
function validateQueryParams(queryParams) {
  const validSort =
    (queryParams.sortOrder === 'desc' || queryParams.sortOrder === 'asc') &&
    (queryParams.sortFieldName === 'amount' ||
      queryParams.sortFieldName === 'date');
  const validSearch =
    (queryParams.searchFieldName === 'type' ||
      queryParams.searchFieldName === 'senderName' ||
      queryParams.searchFieldName === 'recipientName') &&
    queryParams.searchKey;
  return { validSort, validSearch };
}

/**
 * Filter Transaction History
 * @param {string} history - User Transaction History
 * @param {string} queryParams - Query Parameter for Pagination, Sorting, and Search
 * @returns {object}
 */
function searchHistory(history, queryParams) {
  // mengambil searchFieldName dan searchKey dari queryParams
  const { searchFieldName, searchKey } = queryParams;

  return history.filter((history) => {
    return (
      (searchFieldName === 'type' && history.type === searchKey) ||
      (searchFieldName === 'recipientName' &&
        history.recipientName?.includes(searchKey)) ||
      (searchFieldName === 'senderName' &&
        history.senderName?.includes(searchKey))
    );
  });
}

/**
 * Sort Transaction History
 * @param {string} history - User Transaction History
 * @param {string} queryParams - Query Parameter for Pagination, Sorting, and Search
 * @returns {object}
 */
function sortHistory(history, queryParams) {
  // mengambil sortFieldName dan SortOrder dari queryParams
  const { sortFieldName, sortOrder } = queryParams;

  if (sortFieldName === 'date') {
    // Sort by timestamp
    return history.sort((a, b) => {
      const timestampA = new Date(a.timestamp);
      const timestampB = new Date(b.timestamp);

      if (sortOrder === 'asc') {
        return timestampA - timestampB;
      } else {
        return timestampB - timestampA;
      }
    });
  } else if (sortFieldName === 'amount') {
    // Sort by amount
    if (sortOrder === 'asc') {
      return history.sort((a, b) => a.amount - b.amount);
    } else {
      return history.sort((a, b) => b.amount - a.amount);
    }
  }
}

/**
 * Paginate Transaction History
 * @param {string} pageNumber_query - Query Page Number
 * @param {string} pageSize_query - Query Page Size
 * @param {string} history_length - Panjang Transaction History
 * @returns {object}
 */
function paginateHistory(pageNumber_query, pageSize_query, history_length) {
  const pageNumber = pageNumber_query ? pageNumber_query : 1;
  const pageSize = pageSize_query ? pageSize_query : history_length;
  const startIndex = (pageNumber - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, history_length);
  const totalPage = Math.ceil(history_length / pageSize);

  return { pageNumber, pageSize, startIndex, endIndex, totalPage };
}

/**
 * Update Balance
 * @param {string} accountNumber - Account Number
 * @param {string} amount - Jumlah Balance
 * @returns {Promise}
 */
async function updateBalance(accountNumber, amount) {
  try {
    // update balance amount ke akun
    const success = await mainAppRepository.updateBalance(
      accountNumber,
      amount
    );

    if (!success) return null;

    return true;
  } catch (error) {
    console.error('Error updating balance:', error);
    throw error;
  }
}

/**
 * Transfer Balance
 * @param {string} accountNumber_sender - Sender Account Number
 * @param {string} accountNumber_recipient - Recipient Account Number
 * @param {string} amount - Balance Amount
 * @returns {Promise}
 */
async function transferBalance(
  accountNumber_sender,
  accountNumber_recipient,
  amount
) {
  try {
    // mengurangi balance amount ke akun
    const success =
      (await mainAppRepository.updateBalance(accountNumber_sender, -amount)) &&
      (await mainAppRepository.updateBalance(accountNumber_recipient, amount));

    if (!success) return null;

    return true;
  } catch (error) {
    console.error('Error transferring balance:', error);
    throw error;
  }
}

/**
 * Change user account pin
 * @param {string} accountNumber - User Account Number
 * @param {string} pin - pin
 * @returns {boolean}
 */
async function changePin(accountNumber, pin) {
  const bankAccount =
    await mainAppRepository.getAccountByAccountNumber(accountNumber);

  // Check if account not found
  if (!bankAccount) {
    return null;
  }

  // hash pin
  const hashedPin = await hashPin(pin);

  const changeSuccess = await mainAppRepository.changePin(
    accountNumber,
    hashedPin
  );

  if (!changeSuccess) {
    return null;
  }

  return true;
}

/**
 * Create Transaction History
 * @param {string} account - Akun orang yang melakukan transaksi
 * @param {string} amount - Jumlah Balance
 * @param {string} transaction_type - Tipe Transaksi
 * @returns {boolean}
 */
async function createTransactionHistory(account, amount, transaction_type) {
  try {
    // Jika tipe transaksi Transfer
    if (transaction_type === 'Transfer') {
      let sender_transaction_detail = {
        type: 'Transfer Out',
        amount: amount,
        recipientName: account.name_recipient,
      };

      let recipient_transaction_detail = {
        type: 'Transfer In',
        amount: amount,
        senderName: account.name_sender,
      };

      // Buat histori transaksi untuk pengirim ke database
      await mainAppRepository.createTransactionHistory(
        account.accountNumber_sender,
        sender_transaction_detail
      );

      // Buat histori transaksi untuk penerima ke database
      await mainAppRepository.createTransactionHistory(
        account.accountNumber_recipient,
        recipient_transaction_detail
      );

      // Tipe transaksi selain transfer: Deposit dan Withdraw
    } else {
      let transaction_detail = { type: transaction_type, amount: amount };
      await mainAppRepository.createTransactionHistory(
        account,
        transaction_detail
      );
    }
  } catch (err) {
    return null;
  }

  return true;
}

/**
 * Create Random Account Number
 * @returns {string}
 */
function generateRandomAccountNumber() {
  let bankAccountNumber = '901';
  for (let i = 0; i < 7; i++) {
    bankAccountNumber += Math.floor(Math.random() * 9);
  }
  return bankAccountNumber;
}

module.exports = {
  createPin,
  checkPin,
  deleteAccount,
  getBankAccount,
  getBankAccountbyId,
  updateBalance,
  getTransactionHistory,
  transferBalance,
  createTransactionHistory,
  changePin,
  generateRandomAccountNumber,
};
