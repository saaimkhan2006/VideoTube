import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.models.js";
import { Video } from "../models/video.models.js";
import { User } from "../models/user.models.js";
import { Comment } from "../models/comment.models.js";
import { Tweet } from "../models/tweet.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid Video Id");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "No Video Found");
  }
  let like;
  like = await Like.findOne({
    owner: req.user?._id,
    video: videoId,
  });

  if (like) {
    like = await Like.findByIdAndDelete(like._id);
  } else {
    like = await Like.create({
      owner: req.user?._id,
      video: videoId,
    });
  }

  if (!like) {
    throw new ApiError(400, "Something went wrong while liking the Video");
  }
  const likeCount = await Like.countDocuments({ video: videoId });

  return res
    .status(200)
    .json(
      new ApiResponse(200, { like, likeCount }, "Like toggled successfully")
    );
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid Comment Id");
  }

  const comment = await Comment.findById(commentId);

  if (!comment) {
    throw new ApiError(404, "No Comment Found");
  }
  let like;
  like = await Like.findOne({
    owner: req.user?._id,
    Comment: commentId,
  });

  if (like) {
    like = await Like.findByIdAndDelete(like._id);
  } else {
    like = await Like.create({
      owner: req.user?._id,
      Comment: commentId,
    });
  }

  if (!like) {
    throw new ApiError(400, "Something went wrong while liking the Comment");
  }
  const likeCount = await Like.countDocuments({ Comment: commentId });

  return res
    .status(200)
    .json(
      new ApiResponse(200, { like, likeCount }, "Like toggled successfully")
    );
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;

  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid Tweet Id");
  }

  const tweet = await Tweet.findById(tweetId);

  if (!tweet) {
    throw new ApiError(404, "No Tweet Found");
  }
  let like;
  like = await Like.findOne({
    owner: req.user?._id,
    tweet: tweetId,
  });

  if (like) {
    like = await Like.findByIdAndDelete(like._id);
  } else {
    like = await Like.create({
      owner: req.user?._id,
      tweet: tweetId,
    });
  }

  if (!like) {
    throw new ApiError(400, "Something went wrong while liking the Tweet");
  }
  const likeCount = await Like.countDocuments({ tweet: tweetId });

  return res
    .status(200)
    .json(
      new ApiResponse(200, { like, likeCount }, "Like toggled successfully")
    );
});

const getLikedVideos = asyncHandler(async (req, res) => {
  //TODO: get all liked videos

  const allLikedVideos = await Like.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(req.user?._id),
        video: { $exists: true },
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "videoInfo",
        pipeline: [
          {
            $project: {
              VideoFile: 1,
              Thumbnail: 1,
              Title: 1,
              Description: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        videoInfo: {
          $first: "$videoInfo",
        },
      },
    },
    {
      $project: {
        videoInfo: 1,
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        allLikedVideos,
        "All liked videos fetched successfully"
      )
    );
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
