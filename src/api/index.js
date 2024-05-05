const express = require('express');

const authentication = require('./components/authentication/authentication-route');
const users = require('./components/users/users-route');
const mainApp = require('./components/mainApp/mainApp-route');

module.exports = () => {
  const app = express.Router();

  authentication(app);
  users(app);
  mainApp(app);

  return app;
};
