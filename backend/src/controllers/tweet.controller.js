import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Tweet } from "../models/tweet.models.js";
import { User } from "../models/user.models.js";
import mongoose, { isValidObjectId } from "mongoose";

const createTweet = asyncHandler(async (req, res) => {
  const { content } = req.body;

  if (!content?.trim()) {
    throw new ApiError(400, "Content is required");
  }

  try {
    const tweet = await Tweet.create({
      owner: req.user?._id,
      content,
    });

    if (!tweet) {
      throw new ApiError(400, "Something went wrong while posting tweet.");
    }

    return res
      .status(200)
      .json(new ApiResponse(201, tweet, "Tweet created successfully"));
  } catch (error) {
    console.log("Tweets Creation failed", error);
    throw new ApiError(500, "Tweet not created");
  }
});

const getUserTweets = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid User Id");
  }

  try {
    //METHOD 1
    //   const tweets = await Tweet.find({ owner: userId }).populate(
    //     "owner", "username avatar"
    //   );

    //METHOD 2
    const tweets = await Tweet.aggregate([
      {
        $match: {
          owner: new mongoose.Types.ObjectId(userId),
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "owner",
          foreignField: "_id",
          as: "owner",
          pipeline: [
            {
              $project: {
                username: 1,
                avatar: 1,
              },
            },
          ],
        },
      },
      {
        $addFields: {
          owner: {
            $first: "$owner",
          },
        },
      },
      {
        $sort: {
          createdAt: -1,
        },
      },
    ]);

    return res
      .status(200)
      .json(new ApiResponse(200, tweets, "All tweets fetched successfully"));
  } catch (error) {
    console.log("Tweet fetch unsuccessful", error);
    throw new ApiError(400, "Tweet fetch unsuccessful");
  }
});

const updateTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;

  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid Tweet Id");
  }

  const tweet = await Tweet.findById(tweetId);

  if (!tweet) {
    throw new ApiError(404, "No Tweet found");
  }

  if (!tweet.owner.equals(req.user?._id)) {
    throw new ApiError(403, "You are not authorized to update this tweet");
  }

  const { content } = req.body;

  if (!content?.trim()) {
    throw new ApiError(400, "Updated content is required");
  }

  const updatedTweet = await Tweet.findByIdAndUpdate(
    tweetId,
    {
      $set: {
        content: content,
      },
    },
    { new: true }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, updatedTweet, "Tweet updated successfully"));
});

const deleteTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;

  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid Tweet Id");
  }

  const tweet = await Tweet.findById(tweetId);

  if (!tweet) {
    throw new ApiError(404, "No Tweet found");
  }

  if (!tweet.owner.equals(req.user?._id)) {
    throw new ApiError(403, "You are not authorized to delete this tweet");
  }

  const deletedTweet = await Tweet.findByIdAndDelete(tweetId);

  return res
    .status(200)
    .json(new ApiResponse(200, deletedTweet, "Tweet deleted successfully"));
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
