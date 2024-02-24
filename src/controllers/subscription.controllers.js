import mongoose, { isValidObjectId } from "mongoose";
import { Subscription } from "../models/subscriptions.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  // TODO: toggle subscription
});
//get channel subscribers list
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  //TODO: get subscribers list
});
//get channel which user is subscribed
const getSubscribedChannel = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;
});
export { toggleSubscription, getSubscribedChannel, getUserChannelSubscribers };
