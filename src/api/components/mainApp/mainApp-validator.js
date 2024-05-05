const joi = require('joi');
const { joiPasswordExtendCore } = require('joi-password');
const joiPassword = joi.extend(joiPasswordExtendCore);

module.exports = {
  createPin: {
    body: {
      pin: joiPassword
        .number()
        .integer()
        .min(100000)
        .max(999999)
        .strict(true)
        .required()
        .messages({
          'number.base': '{{#label}} must be a number',
          'number.integer': '{{#label}} must be an integer',
          'number.min': '{{#label}} length must be 6 number long',
          'number.max': '{{#label}} length must be 6 number long',
        })
        .label('Pin'),
      pin_confirm: joi
        .number()
        .integer()
        .min(100000)
        .max(999999)
        .strict(true)
        .required()
        .messages({
          'number.base': '{{#label}} must be a number',
          'number.integer': '{{#label}} must be an integer',
          'number.min': '{{#label}} length must be 6 number long',
          'number.max': '{{#label}} length must be 6 number long',
        })
        .label('Pin confirmation'),
    },
  },
  updateBalance: {
    body: {
      accountNumber: joi
        .number()
        .integer()
        .strict()
        .required()
        .messages({
          'number.base': '{{#label}} must be a number',
          'number.integer': '{{#label}} must be an integer',
        })
        .label('Your Account Number'),
      accountNumber_recipient: joi
        .number()
        .integer()
        .messages({
          'number.base': '{{#label}} must be a number',
          'number.integer': '{{#label}} must be an integer',
        })
        .label('Recipient Account Number'),
      amount: joi
        .number()
        .integer()
        .strict(true)
        .greater(0)
        .required()
        .messages({
          'number.base': '{{#label}} must be a number',
          'number.integer': '{{#label}} must be an integer',
        })
        .label('Amount'),
      pin: joi.number().integer().strict(true).required().label('Pin'),
    },
  },
  changePin: {
    body: {
      pin: joi.number().integer().strict(true).required().label('Pin'),
      pin_new: joiPassword
        .number()
        .integer()
        .min(100000)
        .max(999999)
        .strict(true)
        .required()
        .messages({
          'number.base': '{{#label}} must be a number',
          'number.integer': '{{#label}} must be an integer',
          'number.min': '{{#label}} length must be 6 number long',
          'number.max': '{{#label}} length must be 6 number long',
        })
        .label('New Pin'),
      pin_confirm: joi
        .number()
        .integer()
        .min(100000)
        .max(999999)
        .strict(true)
        .required()
        .messages({
          'number.base': '{{#label}} must be a number',
          'number.integer': '{{#label}} must be an integer',
          'number.min': '{{#label}} length must be 6 number long',
          'number.max': '{{#label}} length must be 6 number long',
        })
        .label('Pin confirmation'),
    },
  },
};
