import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.models.js";
import { User } from "../models/user.models.js";
import { Video } from "../models/video.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  //TODO: create playlist

  if (!name?.trim()) {
    throw new ApiError(400, "Name of the playlist is required");
  }

  const playlist = await Playlist.create({
    owner: req.user?._id,
    name,
    description: description || "",
  });

  if (!playlist) {
    throw new ApiError(400, "Something went wrong while creating playlist");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, playlist, "Playlist created successfully"));
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  //TODO: get user playlists

  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid User Id");
  }

  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, "No User Found");
  }

  const playlists = await Playlist.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "playlistVideosInfo",
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
      $project: {
        name: 1,
        description: 1,
        playlistVideosInfo: 1,
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(200, playlists, "All playlists fetched successfully")
    );
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid Playlist Id");
  }

  const playlist = await Playlist.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(playlistId),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "playlistVideosInfo",
        pipeline: [
          {
            $project: {
              VideoFile: 1,
              Thumbnail: 1,
              Title: 1,
              Description: 1,
              Duration: 1,
              Views: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        videoCount: { $size: "$playlistVideosInfo" },
      },
    },
    {
      $project: {
        name: 1,
        description: 1,
        owner: 1,
        videoCount: 1,
        playlistVideosInfo: 1,
      },
    },
  ]);

  if (!playlist?.length) {
    throw new ApiError(404, "Playlist not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, playlist[0], "Playlist fetched successfully"));
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid Playlist or Video Id");
  }

  let playlist = await Playlist.findById(playlistId);

  if (!playlist) {
    throw new ApiError(404, "No playlist found");
  }

  if (!playlist.owner.equals(req.user?._id)) {
    throw new ApiError(403, "You cannot add video to this playlist");
  }

  if (playlist.videos.some((id) => id.equals(videoId))) {
    return res
      .status(200)
      .json(new ApiResponse(200, playlist, "Video already in the playlist"));
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "No video found");
  }

  playlist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $push: { videos: videoId },
    },
    { new: true }
  );
  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Video added to the playlist"));
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  // TODO: remove video from playlist
  if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid Playlist or Video Id");
  }

  let playlist = await Playlist.findById(playlistId);

  if (!playlist) {
    throw new ApiError(404, "No playlist found");
  }

  if (!playlist.owner.equals(req.user?._id)) {
    throw new ApiError(403, "You cannot delete video from this playlist");
  }

  if (!playlist.videos.some((id) => id.equals(videoId))) {
    return res
      .status(200)
      .json(new ApiResponse(200, playlist, "No such video in the playlist"));
  }
  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "No video found");
  }

  playlist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $pull: { videos: videoId },
    },
    { new: true }
  );
  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Video deleted from the playlist"));
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  // TODO: delete playlist

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid Video Id");
  }

  const playlist = await Playlist.findById(playlistId);

  if (!playlist) {
    throw new ApiError(404, "No Playlist found to delete");
  }

  if (!playlist.owner.equals(req.user?._id)) {
    throw new ApiError(
      403,
      "You cannot delete this playlist as you are not the owner"
    );
  }

  await Playlist.findByIdAndDelete(playlistId);

  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Playlist deleted successfully"));
});

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;
  //TODO: update playlist

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid Video Id");
  }

  let playlist = await Playlist.findById(playlistId);

  if (!playlist) {
    throw new ApiError(404, "No Playlist Found");
  }

  if (!playlist.owner.equals(req.user?._id)) {
    throw new ApiError(
      403,
      "You cannot delete this playlist as you are not the owner"
    );
  }

  let updateStage = {};

  if (name) {
    updateStage.name = name;
  }

  if (description) {
    updateStage.description = description;
  }

  if (Object.keys(updateStage).length == 0) {
    throw new ApiError(400, "Atleast one field is required to update");
  }

  playlist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $set: updateStage,
    },
    { new: true }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Playlist updated successfully"));
});

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};
