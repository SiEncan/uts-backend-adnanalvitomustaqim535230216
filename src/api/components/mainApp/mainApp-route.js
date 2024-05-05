const express = require('express');

const authenticationMiddleware = require('../../middlewares/authentication-middleware');
const celebrate = require('../../../core/celebrate-wrappers');
const mainAppControllers = require('./mainApp-controller');
const mainAppValidator = require('./mainApp-validator');

const route = express.Router();

module.exports = (app) => {
  app.use('/mainApp', route);

  // Create transaction pin
  route.post(
    '/:id/create-pin',
    authenticationMiddleware,
    celebrate(mainAppValidator.createPin),
    mainAppControllers.createPin
  );

  // Deposit balance
  route.patch(
    '/deposit-balance',
    authenticationMiddleware,
    celebrate(mainAppValidator.updateBalance),
    mainAppControllers.depositBalance
  );

  // Withdraw balance
  route.patch(
    '/withdraw-balance',
    authenticationMiddleware,
    celebrate(mainAppValidator.updateBalance),
    mainAppControllers.withdrawBalance
  );

  // transfer balance to other user
  route.patch(
    '/transfer-balance',
    authenticationMiddleware,
    celebrate(mainAppValidator.updateBalance),
    mainAppControllers.transferBalance
  );

  // Get Account Info
  route.get(
    '/:id',
    authenticationMiddleware,
    mainAppControllers.getAccountInfo
  );

  // Get transaction history
  route.get(
    '/:accountNumber/transaction-history',
    authenticationMiddleware,
    mainAppControllers.getTransactionHistory
  );

  // Change pin
  route.put(
    '/:accountNumber/change-pin',
    authenticationMiddleware,
    celebrate(mainAppValidator.changePin),
    mainAppControllers.changePin
  );

  // Delete account
  route.delete(
    '/:accountNumber',
    authenticationMiddleware,
    mainAppControllers.deleteAccount
  );
};
