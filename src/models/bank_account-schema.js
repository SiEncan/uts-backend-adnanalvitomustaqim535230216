const BankAccountSchema = {
  accountNumber: { type: Number, required: true },
  balance: { type: Number, default: 0 },
  pin: { type: String, required: true },
  transactionHistory: [
    {
      type: {
        type: String,
        enum: ['Transfer In', 'Transfer Out', 'Withdraw', 'Deposit'],
        required: true,
      },
      amount: { type: Number, required: true },
      timestamp: { type: Date, default: Date.now },
      senderName: { type: String },
      recipientName: { type: String },
    },
  ],
};

module.exports = BankAccountSchema;
