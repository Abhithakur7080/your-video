import mongoose, { isValidObjectId } from "mongoose";
import { Comment } from "../models/comment.model.js";
import { Like } from "../models/like.model.js";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getVideoComments = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;
  //get video information
  const video = await Video.findById(videoId);
  //if video not exist
  if (!video) {
    throw new ApiError(404, "Video not found");
  }
  //video found then get all information using aggregation
  const commentsAggregate = Comment.aggregate([
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
        as: "owner",
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "comment",
        as: "likes",
      },
    },
    {
      $addFields: {
        likesCount: {
          $size: "$likes",
        },
        owner: {
          $first: "$owner",
        },
        isLiked: {
          $cond: {
            if: { $in: [req.user?._id, "$likes.likedBy"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $sort: {
        createdAt: -1,
      },
    },
    {
      $project: {
        content: 1,
        createdAt: 1,
        likesCount: 1,
        owner: {
          username: 1,
          fullName: 1,
          "avatar.url": 1,
        },
        isLiked: 1,
      },
    },
  ]);
  //option for pagination
  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
  };
  //arrange according to query
  const comments = await Comment.aggregatePaginate(commentsAggregate, options);
  //send data to frontend
  return res
    .status(200)
    .json(new ApiResponse(200), comments, "Comments fetched successfully");
});
const addComment = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { content } = req.body;
  //check content having or not
  if (!content) {
    throw new ApiError(400, "Content is Required");
  }
  //get video information
  const video = await Video.findById(videoId);
  //if video not exist
  if (!video) {
    throw new ApiError(404, "video not found");
  }
  //video found then create comment
  const comment = await Comment.create({
    content,
    video: videoId,
    owner: req.user?._id,
  });
  //if not comment created
  if (!comment) {
    throw new ApiError(500, "Failed to add comment please try again");
  }
  //after creation send data to frontend
  return res
    .status(201)
    .json(new ApiResponse(201, comment, "comment added successfully"));
});
const updateComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const { content } = req.body;
  //validate the commentId
  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid commentId");
  }
  //check content having or not
  if (!content) {
    throw new ApiError(400, "content is required");
  }
  //get comment information
  const comment = await Comment.findById(commentId);
  //if comment not exist
  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }
  //match owner or not
  if (comment?.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(400, "You cannot edit this comment because you are not the owner");
  }
  //comment found then update comment
  const updatedComment = await Comment.findByIdAndUpdate(
    comment?._id,
    {
      $set: {
        content,
      },
    },
    {
      new: true,
    }
  );
  //if not comment updated
  if (!updatedComment) {
    throw new ApiError(500, "Failed to edit comment please try again");
  }
  //send data to frontend
  return res
    .status(200)
    .json(new ApiResponse(200, updatedComment, "comments edited successfully"));
});
const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  //validate the commentId
  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid commentId");
  }
  //get comment information
  const comment = await Comment.findById(commentId);
  //if comment not exist
  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }
  //match owner or not
  if (comment?.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(400, "You cannot delete this comment because you are not the owner");
  }
  //if found then delete comment and details
  await Comment.findByIdAndDelete(commentId);
  //remove comment likes
  await Like.deleteMany({
    comment: commentId,
    likedBy: req.user,
  });
  //send data to frontend
  return res
    .status(200)
    .json(new ApiResponse(200, { commentId }, "Comment deleted successfully"));
});
export { getVideoComments, addComment, updateComment, deleteComment };
