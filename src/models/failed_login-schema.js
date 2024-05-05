const FailedLoginAttemptSchema = {
  email: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  count: { type: Number, default: 0 },
};

module.exports = FailedLoginAttemptSchema;
