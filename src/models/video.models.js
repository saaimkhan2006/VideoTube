/*

  id string pk
  owner ObjectId users
  videoFile string
  thumbnail string
  title string
  description string
  duration number
  views number
  isPublished boolean
  createdAt Date
  updatedAt Date

*/

import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new Schema(
  {
    Owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    VideoFile: {
      type: String, //Cloudnary URL
      required: true,
    },
    Thumbnail: {
      type: String, //Cloudnary URL
      required: true,
    },
    Title: {
      type: String,
      required: true,
    },
    Description: {
      type: String,
    },
    Duration: {
      type: Number,
      required: true,
    },
    Views: {
      type: Number,
      default: 0,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

videoSchema.plugin(mongooseAggregatePaginate);

export const Video = mongoose.model("Video", videoSchema);
