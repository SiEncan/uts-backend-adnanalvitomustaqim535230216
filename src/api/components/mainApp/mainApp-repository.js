const { BankAccount } = require('../../../models');

/**
 * Create new pin
 * @param {string} id - User Id
 * @param {string} accountNumber - Account Number
 * @param {string} pin - Hashed Pin
 * @returns {Promise}
 */
async function createPin(id, accountNumber, pin) {
  return BankAccount.create({
    id,
    accountNumber,
    pin,
  });
}

/**
 * Delete user account
 * @param {string} accountNumber - User Account Number
 * @returns {Promise}
 */
async function deleteAccount(accountNumber) {
  return BankAccount.deleteOne({ accountNumber });
}

/**
 * Get account by accountNumber
 * @param {string} accountNumber - User Account Number
 * @returns {Promise}
 */
async function getAccountByAccountNumber(accountNumber) {
  return BankAccount.findOne({ accountNumber });
}

/**
 * Get account by id
 * @param {string} id - User Id
 * @returns {Promise}
 */
async function getAccountById(id) {
  return BankAccount.findOne({ _id: id });
}

/**
 * Update User Balance
 * @param {string} accountNumber - User Account Number
 * @param {string} amount - Jumlah Balance
 */
async function updateBalance(accountNumber, amount) {
  return BankAccount.updateOne(
    { accountNumber },
    { $inc: { balance: amount } }
  );
}

/**
 * Create Transaction History
 * @param {string} accountNumber - User Account Number
 * @param {string} transaction_detail - Transaction Details
 * @returns {Promise}
 */
async function createTransactionHistory(accountNumber, transaction_detail) {
  return BankAccount.updateOne(
    { accountNumber },
    {
      $push: { transactionHistory: transaction_detail },
    }
  );
}

/**
 * Update user account pin
 * @param {string} accountNumber - User Account Number
 * @param {string} pin - New hashed pin
 * @returns {Promise}
 */
async function changePin(accountNumber, pin) {
  return BankAccount.updateOne({ accountNumber }, { $set: { pin } });
}

module.exports = {
  createPin,
  getAccountByAccountNumber,
  getAccountById,
  updateBalance,
  createTransactionHistory,
  changePin,
  deleteAccount,
};
