import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.models.js";
import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  uploadOnCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinary.js";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;

  const matchStage = { isPublished: true };

  if (userId?.trim()) {
    if (isValidObjectId(userId)) {
      matchStage.Owner = new mongoose.Types.ObjectId(userId);
    } else {
      throw new ApiError(400, "Enter Valid User Id");
    }
  }

  if (query?.trim()) {
    matchStage.$or = [
      { Title: { $regex: query, $options: "i" } },
      { Description: { $regex: query, $options: "i" } },
    ];
  }

  const sortOrder = sortType === "asc" ? 1 : -1;

  const sortStage = { [sortBy || "createdAt"]: sortBy ? sortOrder : -1 };

  const videoAggregate = Video.aggregate([
    { $match: matchStage },
    { $sort: sortStage },
  ]);

  const result = await Video.aggregatePaginate(videoAggregate, { page, limit });

  return res
    .status(200)
    .json(new ApiResponse(200, result, "All Videos fetched Successfully"));
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;

  if ([title, description].some((field) => field?.trim() == "")) {
    throw new ApiError(400, "All fields are required");
  }

  console.log(req.files);
  const videoLocalPath = req.files?.video?.[0]?.path;
  const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;

  if (!videoLocalPath || !thumbnailLocalPath) {
    throw new ApiError(400, "Both Video and Thumbnail file is required");
  }

  let videoData = "";
  try {
    videoData = await uploadOnCloudinary(videoLocalPath);
    console.log("Video uploaded", videoData);
  } catch (error) {
    console.log("Error uploading video", error);
    throw new ApiError(500, "Video not uploaded Error");
  }

  let thumbnail = "";
  try {
    thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
    console.log("thumbnail uploaded", thumbnail);
  } catch (error) {
    console.log("Error uploading Thumbnail", error);
    throw new ApiError(500, "Thumbnail not uploaded Error");
  }

  try {
    const video = await Video.create({
      Owner: req.user?._id,
      VideoFile: videoData.url,
      Thumbnail: thumbnail.url,
      Title: title,
      Description: description,
      Duration: videoData.duration,
    });

    const createdVideo = await Video.findById(video._id);

    if (!createdVideo) {
      throw new ApiError(500, "Something went wrong while creating video");
    }

    return res
      .status(201)
      .json(new ApiResponse(201, createdVideo, "Video uploaded successfully"));
  } catch (error) {
    console.log("Video upload failed", error);

    if (videoData) {
      await deleteFromCloudinary(videoData.public_id);
    }
    if (thumbnail) {
      await deleteFromCloudinary(thumbnail.public_id);
    }
    throw new ApiError(
      500,
      "Something went wrong while publishing the video and files were deleted"
    );
  }
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid Video Id");
  }

  const video = await Video.findByIdAndUpdate(
    videoId,
    { $inc: { Views: 1 } },
    { new: true }
  );

  if (!video) {
    throw new ApiError(404, "No Video found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video found successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid Video Id");
  }

  let video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "No video Found");
  }

  if (!video.Owner.equals(req.user?._id)) {
    throw new ApiError(403, "Unauthorized access");
  }

  const { title, description } = req.body;
  const thumbnailLocalPath = req.file?.path;

  const updateFields = {};

  if (title?.trim()) {
    updateFields.Title = title;
  }

  if (description?.trim()) {
    updateFields.Description = description;
  }

  if (thumbnailLocalPath) {
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

    const currentVideo = await Video.findById(videoId);

    updateFields.Thumbnail = thumbnail.url;

    const oldThumbnailUrl = currentVideo.Thumbnail;
    const oldThumbnailPublicId = oldThumbnailUrl
      .split("/")
      .at(-1)
      .split(".")[0];
    await deleteFromCloudinary(oldThumbnailPublicId);
  }

  if (Object.keys(updateFields).length === 0) {
    throw new ApiError(400, "At least one field is required to update");
  }

  video = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: updateFields,
    },
    { new: true }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Details Updated Successfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid Video Id");
  }
  let video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "No video Found");
  }

  if (!video.Owner.equals(req.user?._id)) {
    throw new ApiError(403, "Unauthorized access");
  }

  if (!video) {
    throw new ApiError(404, "No Video found");
  }

  const videoPublicId = video.VideoFile.split("/").at(-1).split(".")[0];
  const thumbnailPublicId = video.Thumbnail.split("/").at(-1).split(".")[0];
  await deleteFromCloudinary(videoPublicId);
  await deleteFromCloudinary(thumbnailPublicId);

  video = await Video.findByIdAndDelete(videoId);

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video Deleted successfully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid Video Id");
  }
  let video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "No video Found");
  }

  if (!video.Owner.equals(req.user?._id)) {
    throw new ApiError(403, "Unauthorized access");
  }

  video = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        isPublished: !video.isPublished,
      },
    },
    { new: true }
  );

  return res
    .status(200)
    .json(
      new ApiResponse(200, video, `Video Published:${video.isPublished} now`)
    );
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
