const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true
    },
    purchase_datetime: {
      type: Date,
      default: Date.now
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    purchaser: {
      type: String,
      required: true
    },
    items: [
      {
        _id: false,
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        title: String,
        price: Number,
        quantity: Number
      }
    ]
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model("Ticket", ticketSchema);
