import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";

// create playlist
const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  //check both field not available
  if (!name || !description) {
    throw new ApiError(400, "name and description both are required");
  }
  //both field exists then create a playlist
  const playlist = await Playlist.create({
    name,
    description,
    owner: req.user?._id,
  });
  //if playlist not created
  if (!playlist) {
    throw new ApiError(500, "failed to create playlist");
  }
  //send data to frontend
  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "playlist created successfully"));
});
// update playlist
const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;
  //validate the playlistId
  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlistId");
  }
  //check both field not available
  if (!name || !description) {
    throw new ApiError(400, "name and description both field are required");
  }
  //get playlist information
  const playlist = await Playlist.findById(playlistId);
  //if playlist not exist
  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }
  //match owner or not
  if (playlist.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(
      400,
      "You cannot edit this playlist because you are not the owner"
    );
  }
  //playlist found then update the playlist
  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $set: {
        name,
        description,
      },
    },
    {
      new: true,
    }
  );
  //if not playlist updated
  if (!updatePlaylist) {
    throw new ApiError(500, "Failed to edit playlist, please try again");
  }
  //send data to frontend
  return res
    .status(200)
    .json(
      new ApiResponse(200, updatePlaylist, "Playlist updated successfully")
    );
});
// delete playlist
const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  //validate the playlistId
  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlistId");
  }
  //get playlist information
  const playlist = await Playlist.findById(playlistId);
  //if playlist not exist
  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }
  //match owner or not
  if (playlist.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(
      400,
      "You cannot delete this playlist because you are not the owner"
    );
  }
  //if found then delete playlist and details
  await Playlist.findByIdAndDelete(playlistId);
  //send data to frontend
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Playlist deleted successfully"));
});
// add video to playlist
const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  //validate the playlistId
  if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid playlistId or videoId");
  }
  //get playlist information
  const playlist = await Playlist.findById(playlistId);
  //get video information
  const video = await Video.findById(videoId);
  //if playlist not exist
  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }
  //if video not exist
  if (!video) {
    throw new ApiError(404, "Video not found");
  }
  //match owner or not
  if (
    (playlist.owner.toString() && video.owner.toString()) !==
    req.user?._id.toString()
  ) {
    throw new ApiError(
      400,
      "You cannot add this video in playlist because you are not the owner"
    );
  }
  //update the playlist
  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $addToSet: {
        videos: videoId,
      },
    },
    {
      new: true,
    }
  );
  //if playlist not updated
  if (!updatedPlaylist) {
    throw new ApiError(
      400,
      "failed to add video in playlist, please try again"
    );
  }
  //send data to frontend
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedPlaylist,
        "video added to playlist successfully"
      )
    );
});
// remove video from playlist
const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  //validate the playlistId
  if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid playlistId or videoId");
  }
  //get playlist information
  const playlist = await Playlist.findById(playlistId);
  //get video information
  const video = await Video.findById(videoId);
  //if playlist not exist
  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }
  //if video not exist
  if (!video) {
    throw new ApiError(404, "Video not found");
  }
  //match owner or not
  if (
    (playlist.owner.toString() && video.owner.toString()) !==
    req.user?._id.toString()
  ) {
    throw new ApiError(
      400,
      "You cannot remove this video from playlist because you are not the owner"
    );
  }
  //update the playlist
  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $pull: {
        videos: videoId,
      },
    },
    {
      new: true,
    }
  );
  //if playlist not updated
  if (!updatedPlaylist) {
    throw new ApiError(
      400,
      "failed to remove video from playlist, please try again"
    );
  }
  //send data to frontend
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedPlaylist,
        "video removed from playlist successfully"
      )
    );
});
// get playlist by id
const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  //validate the playlistId
  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlistId");
  }
  //get playlist information
  const playlist = await Playlist.findById(playlistId);
  //if playlist not exist
  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }
  //playlist found then get playlist videos by aggregation
  const playlistVideos = await Playlist.aggregate([
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
        as: "videos",
      },
    },
    {
      $match: {
        "videos.isPublished": true,
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
      },
    },
    {
      $addFields: {
        totalVideos: {
          $size: "$videos",
        },
        totalViews: {
          $sum: "$videos.views",
        },
        owner: {
          $first: "$owner",
        },
      },
    },
    {
      $project: {
        name: 1,
        description: 1,
        createdAt: 1,
        updatedAt: 1,
        totalVideos: 1,
        totalViews: 1,
        videos: {
          _id: 1,
          "videoFile.url": 1,
          "thumbnail.url": 1,
          title: 1,
          description: 1,
          duration: 1,
          createdAt: 1,
          views: 1,
        },
        owner: {
          username: 1,
          fullName: 1,
          "avatar.url": 1,
        },
      },
    },
  ]);
  //send data to frontend
  return res
    .status(200)
    .json(
      new ApiResponse(200, playlistVideos[0], "Playlist fetched successfully")
    );
});
// get user playlists
const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  //validate the userId
  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid userId");
  }
  //get playlist videos by aggregation
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
        as: "videos",
      },
    },
    {
      $addFields: {
        totalVideos: {
          $size: "$videos",
        },
        totalViews: {
          $sum: "$videos.views",
        },
      },
    },
    {
      $project: {
        _id: 1,
        name: 1,
        description: 1,
        updatedAt: 1,
        totalVideos: 1,
        totalViews: 1,
      },
    },
  ]);
  //send data to frontend
  return res
    .status(200)
    .json(
      new ApiResponse(200, playlists, "User Playlist fetched successfully")
    );
});
export {
  createPlaylist,
  getPlaylistById,
  getUserPlaylists,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};
