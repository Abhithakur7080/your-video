import mongoose, { isValidObjectId } from "mongoose";
import { Subscription } from "../models/subscriptions.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// toggle subscription
const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  //validate channelId
  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid channelId");
  }
  //get subscription status
  const isSubscribed = await Subscription.findOne({
    subscriber: req.user?._id,
    channel: channelId,
  });
  //if yes subscribed then set it unsubscribed
  if (isSubscribed) {
    await Subscription.findByIdAndDelete(isSubscribed?._id);
    //send data to frontend
    return res.status(200).json(
      new ApiResponse(
        200,
        {
          subscribed: false,
        },
        "unsubscribed successfully"
      )
    );
  }
  //not subscribed then subscribe the channel
  await Subscription.create({
    subscriber: req.user?._id,
    channel: channelId,
  });
  //send data to frontend
  return res.status(200).json(
    new ApiResponse(
      200,
      {
        subscribed: true,
      },
      "subscribed successfully"
    )
  );
});
//get channel subscribers list
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  // validate channelId
  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid channelId");
  }
  //get all subscribers details using aggregation
  const subscribers = await Subscription.aggregate([
    {
      $match: {
        channel: new mongoose.Types.ObjectId(channelId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "subscriber",
        foreignField: "_id",
        as: "subscriber",
        pipeline: [
          {
            $lookup: {
              from: "subscriptions",
              localField: "_id",
              foreignField: "channel",
              as: "subscribedToSubscriber",
            },
          },
          {
            $addFields: {
              subscribedToSubscriber: {
                $cond: {
                  if: {
                    $in: [channelId, "$subscribedToSubscriber.subscriber"],
                  },
                  then: true,
                  else: false,
                },
              },
              subscribersCount: {
                $size: "$subscribedToSubscriber",
              },
            },
          },
        ],
      },
    },
    {
      $unwind: "$subscriber",
    },
    {
      $project: {
        _id: 0,
        subscriber: {
          _id: 1,
          username: 1,
          fullName: 1,
          "avatar.url": 1,
          subscribedToSubscriber: 1,
          subscribersCount: 1,
        },
      },
    },
  ]);
  //send data to frontend
  return res
    .status(200)
    .json(
      new ApiResponse(200, subscribers, "subscribers fetched successfully")
    );
});
//get channel which user is subscribed
const getSubscribedChannel = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;
  // validate subscriberId
  if (!isValidObjectId(subscriberId)) {
    throw new ApiError(400, "Invalid channelId");
  }
  //get all subscribed channels details
  const subscribedChannels = await Subscription.aggregate([
    {
      $match: {
        subscriber: new mongoose.Types.ObjectId(subscriberId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "channel",
        foreignField: "_id",
        as: "subscribedChannel",
        pipeline: [
          {
            $lookup: {
              from: "videos",
              localField: "_id",
              foreignField: "owner",
              as: "videos",
            },
          },
          {
            $addFields: {
              latestVideo: {
                $last: "$videos",
              },
            },
          },
        ],
      },
    },
    {
      $unwind: "$subscribedChannel",
    },
    {
      $project: {
        _id: 0,
        subscribedChannel: {
          _id: 1,
          username: 1,
          fullName: 1,
          "avatar.url": 1,
          latestVideo: {
            _id: 1,
            "videoFile.url": 1,
            "thumbnail.url": 1,
            owner: 1,
            title: 1,
            description: 1,
            duration: 1,
            createdAt: 1,
            views: 1,
          },
        },
      },
    },
  ]);
  // send data to frontend
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        subscribedChannels,
        "subscribed channels fetched successfully"
      )
    );
});
export { toggleSubscription, getSubscribedChannel, getUserChannelSubscribers };
