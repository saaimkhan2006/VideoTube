import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.models.js";
import { Subscriber } from "../models/subscription.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { pipeline } from "stream";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid Channel Id");
  }

  const channel = await User.findById(channelId);

  if (!channel) {
    throw new ApiError(404, "No Channel Found");
  }

  if (req.user?._id.equals(channelId)) {
    throw new ApiError(403, "You cannot subscribe to your own channel");
  }

  const alreadySubscribed = await Subscriber.findOne({
    subscriber: req.user?._id,
    Channel: channelId,
  });

  let subscribe;

  if (alreadySubscribed) {
    subscribe = await Subscriber.findByIdAndDelete(alreadySubscribed._id);
  } else {
    subscribe = await Subscriber.create({
      subscriber: new mongoose.Types.ObjectId(req.user?._id),
      Channel: new mongoose.Types.ObjectId(channelId),
    });
  }

  return res
    .status(200)
    .json(new ApiResponse(200, subscribe, "Subscribtion successfully toggled"));
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid Channel Id");
  }

  const subscribers = await Subscriber.aggregate([
    {
      $match: {
        Channel: new mongoose.Types.ObjectId(channelId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "subscriber",
        foreignField: "_id",
        as: "SubscriberInfo",
        pipeline: [
          {
            $project: {
              fullname: 1,
              username: 1,
              email: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        SubscriberInfo: {
          $first: "$SubscriberInfo",
        },
      },
    },
    {
      $project: {
        SubscriberInfo: 1,
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(200, subscribers, "All subscribers fetched successfully")
    );
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;

  if (!isValidObjectId(subscriberId)) {
    throw new ApiError(400, "Invalid Channel Id");
  }

  const channels = await Subscriber.aggregate([
    {
      $match: {
        subscriber: new mongoose.Types.ObjectId(subscriberId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "Channel",
        foreignField: "_id",
        as: "channelInfo",
        pipeline: [
          {
            $project: {
              username: 1,
              avatar: 1,
              coverImage: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        channelInfo: {
          $first: "$channelInfo",
        },
      },
    },
    {
      $project: {
        channelInfo: 1,
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        channels,
        "All subscribed channels fetched successfully"
      )
    );
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
