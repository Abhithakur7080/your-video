import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// toggle like on video
const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  console.log(videoId);
  //validate videoId
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid videoId");
  }
  //check already liked or not
  const likeAlready = await Like.findOne({
    video: videoId,
    likedBy: req.user?._id,
  });
  //if liked then hit dislike
  if (likeAlready) {
    await Like.findByIdAndUpdate(likeAlready?._id);
    //send data to frontend
    return res.status(200).json(new ApiResponse(200), { isLiked: false });
  }
  //else like it
  await Like.create({
    video: videoId,
    likedBy: req.user?._id,
  });
  //send data to frontend
  return res.status(200).json(new ApiResponse(200, { isLiked: true }));
});
// toggle like on comment
const toggleCommentsLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  //validate videoId
  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid commentId");
  }
  //check already liked or not
  const likeAlready = await Like.findOne({
    comment: commentId,
    likedBy: req.user?._id,
  });
  //if liked then hit dislike
  if (likeAlready) {
    await Like.findByIdAndUpdate(likeAlready?._id);
    //send data to frontend
    return res.status(200).json(new ApiResponse(200), { isLiked: false });
  }
  //else like it
  await Like.create({
    comment: commentId,
    likedBy: req.user?._id,
  });
  //send data to frontend
  return res.status(200).json(new ApiResponse(200, { isLiked: true }));
});
// toggle like on tweet
const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  //validate videoId
  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid tweetId");
  }
  //check already liked or not
  const likeAlready = await Like.findOne({
    tweet: tweetId,
    likedBy: req.user?._id,
  });
  //if liked then hit dislike
  if (likeAlready) {
    await Like.findByIdAndUpdate(likeAlready?._id);
    //send data to frontend
    return res.status(200).json(new ApiResponse(200), { isLiked: false });
  }
  //else like it
  await Like.create({
    tweet: tweetId,
    likedBy: req.user?._id,
  });
  //send data to frontend
  return res.status(200).json(new ApiResponse(200, { isLiked: true }));
});
// get all liked videos
const getLikedVideos = asyncHandler(async (req, res) => {
  //aggregate and get all details
  const likeVideosAggregate = await Like.aggregate([
    {
      $match: {
        likedBy: new mongoose.Types.ObjectId(req.user?._id),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "likedVideo",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "ownerDetails",
            },
          },
          {
            $unwind: "$ownerDetails",
          },
        ],
      },
    },
    {
      $unwind: "$likedVideo",
    },
    {
      $sort: {
        createdAt: -1,
      },
    },
    {
      $project: {
        _id: 0,
        likedVideo: {
          _id: 1,
          "videoFile.url": 1,
          "thumbnail.url": 1,
          owner: 1,
          title: 1,
          description: 1,
          views: 1,
          duration: 1,
          createdAt: 1,
          isPublished: 1,
          ownerDetails: {
            username: 1,
            fullName: 1,
            "avatar.url": 1,
          },
        },
      },
    },
  ]);
  //send data to frontend
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        likeVideosAggregate,
        "liked videos fetched successfully"
      )
    );
});

export { toggleCommentsLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
