const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const mailSchema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    fullName: {
      type: String,
      require: true,
    },
    email: {
      type: String,
      require: true,
    },
    phoneNumber: {
      type: String,
      require: true,
    },
    subject: {
      type: String,
      require: true,
    },
    messageBody: {
      type: String,
      require: true,
    },
    readed: {
      type: Boolean,
      default: false,
    },
    readedAt: {
      type: Date,
      default: null,
    },
    isAnswered: {
      type: Boolean,
      default: false,
    },
    answeredAt: {
      type: Date,
      default: null,
    },
    answeredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    answeredMessage: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("OurEmail", mailSchema);
