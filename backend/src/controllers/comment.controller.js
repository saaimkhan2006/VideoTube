import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.models.js";
import { Comment } from "../models/comment.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const getVideoComments = asyncHandler(async (req, res) => {
  //TODO: get all comments for a video
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid Video Id");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "No Video Found");
  }

  const commentAggregate = Comment.aggregate([
    {
      $match: {
        video: new mongoose.Types.ObjectId(videoId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "commentInfo",
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
        commentInfo: {
          $first: "$commentInfo",
        },
      },
    },
    {
      $sort: {
        createdAt: -1,
      },
    },
  ]);

  const result = await Comment.aggregatePaginate(commentAggregate, {
    page,
    limit,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(200, result, "All Video comments fetched Successfully")
    );
});

const addComment = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid Video Id");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  const { content } = req.body;

  if (!content?.trim()) {
    throw new ApiError(400, "Comment cannot be empty");
  }

  const comment = await Comment.create({
    owner: req.user?._id,
    content,
    video: videoId,
  });

  if (!comment) {
    throw new ApiError(400, "Something went wrong while writing comment");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, comment, "Comment created successfully"));
});

const updateComment = asyncHandler(async (req, res) => {
  // TODO: update a comment
  const { commentId } = req.params;

  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid Comment Id");
  }

  const oldComment = await Comment.findById(commentId);

  if (!oldComment) {
    throw new ApiError(404, "No Comment found");
  }

  if (!oldComment.owner.equals(req.user?._id)) {
    throw new ApiError(403, "You are not authorized to update this Comment");
  }

  const { content } = req.body;

  if (!content?.trim()) {
    throw new ApiError(400, "Updated content is required");
  }

  const updateComment = await Comment.findByIdAndUpdate(
    commentId,
    {
      $set: {
        content,
      },
    },
    { new: true }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, updateComment, "Comment updated successfully"));
});

const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid Comment Id");
  }

  const oldComment = await Comment.findById(commentId);

  if (!oldComment) {
    throw new ApiError(404, "No Comment found");
  }

  if (!oldComment.owner.equals(req.user?._id)) {
    throw new ApiError(403, "You are not authorized to Delete this Comment");
  }

  const deleteComment = await Comment.findByIdAndDelete(commentId);

  return res
    .status(200)
    .json(new ApiResponse(200, deleteComment, "Comment Deleted successfully"));
});

export { getVideoComments, addComment, updateComment, deleteComment };
