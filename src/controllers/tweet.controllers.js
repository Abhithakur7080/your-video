import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

//create tweet
const createTweet = asyncHandler(async (req, res) => {
  const { content } = req.body;
  //check content available or not
  if (!content) {
    throw new ApiError(400, "content is required");
  }
  const tweet = await Tweet.create({
    content,
    owner: req.user?._id,
  });
  //check tweet created or not
  if (!tweet) {
    throw new ApiError(500, "Failed to create tweet, please try again");
  }
  //send data to frontend
  res
    .status(200)
    .json(new ApiResponse(200, tweet, "Tweet created successfully"));
});
//get user tweets
const getUserTweet = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  //validate userId
  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid userId");
  }
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
        as: "ownerDetails",
        pipeline: [
          {
            $project: {
              username: 1,
              "avatar.url": 1,
            },
          },
        ],
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "tweet",
        as: "likeDetails",
        pipeline: [
          {
            $project: {
              likedBy: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        likesCount: {
          $size: "$likeDetails",
        },
        ownerDetails: {
          $first: "$ownerDetails",
        },
        isLiked: {
          $cond: {
            if: { $in: [req.user?._id, "$likeDetails.likedBy"] },
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
        ownerDetails: 1,
        likesCount: 1,
        createdAt: 1,
        isLiked: 1,
      },
    },
  ]);
  return res
    .status(200)
    .json(new ApiResponse(200, tweets, "Tweets fetched successfully"));
});
// update tweet
const updateTweet = asyncHandler(async (req, res) => {
  const { content } = req.body;
  const { tweetId } = req.params;

  //check content available or not
  if (!content) {
    throw new ApiError(400, "Content is required");
  }

  //validate the tweetId
  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid tweetId");
  }

  //get tweet information from mongoose database
  const tweet = await Tweet.findById(tweetId);

  //if tweet information not found
  if (!tweet) {
    throw new ApiError(404, "Tweet not found");
  }

  //match owner or not
  if (tweet?.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(
      400,
      "You cannot edit this tweet because you are not the owner"
    );
  }
  const newTweet = await Tweet.findByIdAndUpdate(
    tweetId,
    {
      $set: {
        content,
      },
    },
    {
      new: true,
    }
  );
  //if not updated the tweet
  if (!newTweet) {
    throw new ApiError(500, "Failed to edit tweet please try again");
  }
  //send data to frontend
  res
    .status(200)
    .json(new ApiResponse(200, newTweet, "Tweet updated successfully"));
});
// delete tweet
const deleteTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  //validate tweetId
  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid tweetId");
  }
  //get tweet information from database
  const tweet = await Tweet.findById(tweetId);

  //if tweet information not found
  if (!tweet) {
    throw new ApiError(404, "Tweet not found");
  }
  //match owner or not
  if (tweet?.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(
      400,
      "You cannot delete this tweet because you are not the owner"
    );
  }
  const tweetDeleted = await Tweet.findByIdAndDelete(tweetId);
  //some issues tweet not deleted
  if (!tweetDeleted) {
    throw new ApiError(400, "Failed to delete the tweet, Please try again");
  }
  //remove all tweet likes
  await Like.deleteMany({
    tweet: tweetId,
  });
  //remove all tweet comments
  await Comment.deleteMany({
    tweet: tweetId,
  });
  //send data to frontend
  return res.status(200).json(new ApiResponse(200, {tweetId}, "Tweet deleted successfully"))
});
export { createTweet, getUserTweet, updateTweet, deleteTweet };
