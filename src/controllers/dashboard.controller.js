import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.models.js";
import { Video } from "../models/video.models.js";
import { Subscriber } from "../models/subscription.models.js";
import { Like } from "../models/like.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getChannelStats = asyncHandler(async (req, res) => {
  // TODO: Get the channel stats like total video views, total subscribers, total videos,
  //  total likes etc.

  const totalSubscriber = await Subscriber.countDocuments({
    Channel: req.user?._id,
  });

  const videoStats = await Video.aggregate([
    {
      $match: {
        Owner: req.user?._id,
      },
    },
    {
      $group: {
        _id: null,
        totalViews: { $sum: "$Views" },
        totalVideos: { $sum: 1 },
      },
    },
  ]);

  const likeStats = await Video.aggregate([
    {
      $match: {
        Owner: req.user?._id,
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "video",
        as: "videoLikes",
      },
    },
    {
      $group: {
        _id: null,
        totalLikes: { $sum: { $size: "$videoLikes" } },
      },
    },
  ]);

  const stats = {
    totalLikes: likeStats[0]?.totalLikes || 0,
    totalSubscriber,
    totalViews: videoStats[0]?.totalViews || 0,
    totalVideos: videoStats[0]?.totalVideos || 0,
  };

  return res
    .status(200)
    .json(new ApiResponse(200, stats, "Channel stats fetched successfully"));
});

const getChannelVideos = asyncHandler(async (req, res) => {
  // TODO: Get all the videos uploaded by the channel

  const channelVideos = await Video.aggregate([
    {
      $match: {
        Owner: req.user?._id,
      },
    },
    {
      $project: {
        VideoFile: 1,
        Thumbnail: 1,
        Title: 1,
        Description: 1,
        Duration: 1,
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(200, channelVideos, "All Videos Fetched successfully")
    );
});

export { getChannelStats, getChannelVideos };
