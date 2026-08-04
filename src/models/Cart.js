const mongoose = require("mongoose");

const cartProductSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1
    }
  },
  {
    _id: false
  }
);

const cartSchema = new mongoose.Schema(
  {
    products: {
      type: [cartProductSchema],
      default: []
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

module.exports = mongoose.model("Cart", cartSchema);
