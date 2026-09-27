/*

  id string pk
  subscriber ObjectId users
  channel ObjectId users
  createdAt Date
  updatedAt Date

*/

import mongoose, { Schema } from "mongoose";

const subscriptionSchema = new Schema(
  {
    subscriber: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    Channel: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export const Subscriber = mongoose.model("Subscriber", subscriptionSchema);
