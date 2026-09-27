/*
  id string pk
  owner ObjectId users
  video ObjectId videos
  comment ObjectId comments
  tweet ObjectId tweets
  createdAt Date
  updatedAt Date
*/

import mongoose, { Schema } from "mongoose";

const likeSchema = new Schema(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    video: {
      type: Schema.Types.ObjectId,
      ref: "Video",
    },
    Comment: {
      type: Schema.Types.ObjectId,
      ref: "Comment",
    },
    tweet: {
      type: Schema.Types.ObjectId,
      ref: "Tweet",
    },
  },
  { timestamps: true }
);

export const Like = mongoose.model("Like", likeSchema);
