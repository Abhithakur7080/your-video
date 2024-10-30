import { Video } from "../models/video.model.js";
import { Like } from "../models/like.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { deleteOnCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";
import mongoose, { isValidObjectId } from "mongoose";

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
  // get all videos based on query, sort and paginations
  const pipeline = [];
  //search by query
  if (query) {
    pipeline.push({
      $search: {
        index: "search-videos",
        text: {
          query: query,
          path: ["title", "description"],
        },
      },
    });
  }
  if (userId) {
    //validate mongoose id
    if (!isValidObjectId(userId)) {
      throw new ApiError(400, "Invalid userId");
    }
    // check if owner then add
    pipeline.push({
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    });
  }
  //check and show published result
  pipeline.push({ $match: { isPublished: true } });

  //sort by - name, date, description..., type is ascending or descending order
  if (sortBy && sortType) {
    pipeline.push({
      $sort: {
        [sortBy]: sortType === "asc" ? 1 : -1,
      },
    });
  } else {
    //if not passed any sort then sort by created time
    pipeline.push({ $sort: { createdAt: -1 } });
  }
  //check and also show some owner details on video info
  pipeline.push(
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
      $unwind: "$ownerDetails",
    }
  );
  //connect to pipeline
  const videoAggregate = Video.aggregate(pipeline);
  //pagination options
  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
  };
  //connect pagination
  const video = await Video.aggregatePaginate(videoAggregate, options);
  //send data to frontend
  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video fetched successfully"));
});

const publishVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  // get video upload to cloudinary, create video
  if ([title, description].some((field) => field?.trim() === "")) {
    throw new Error(400, "All fields are required");
  }
  //video and thumbnail local path
  const videoFileLocalPath = req.files?.videoFile[0].path;
  const thumbnailLocalPath = req.files?.thumbnail[0].path;
  //if video local path not exist
  if (!videoFileLocalPath) {
    throw new Error(400, "videoFileLocalPath is required");
  }
  //if thumbnail local path not exist
  if (!thumbnailLocalPath) {
    throw new Error(400, "thumbnailLocalPath is required");
  }
  console.log(req.body, req.files);

  //upload video or thumbnail to cloudinary database
  const videoFile = await uploadOnCloudinary(videoFileLocalPath);
  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
  //after upload video file not received
  if (!videoFile) {
    throw new Error(400, "Video file not found");
  }
  //after upload thumbnail file not received
  if (!thumbnail) {
    throw new Error(400, "Thumbnail not found");
  }
  // console.log(thumbnail, videoFile);
  //after successfull create a video model
  const video = await Video.create({
    title,
    description,
    duration: videoFile.duration,
    videoFile: {
      url: videoFile.url,
      public_id: videoFile.public_id,
    },
    thumbnail: {
      url: thumbnail.url,
      public_id: thumbnail.public_id,
    },
    owner: req.user?._id,
    isPublished: false,
  });
  //check if video is uploaded or not
  const videoUploaded = await Video.findById(video._id);
  if (!videoUploaded) {
    throw new ApiError(500, "video upload failed please try again !!!");
  }
  //send data to frontend
  return res
    .status(200)
    .json(new ApiResponse(200, "Video uploaded successfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //validate mongoose video id
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid videoId");
  }
  //validate mongoose user id
  if (!isValidObjectId(req.user?._id)) {
    throw new ApiError(400, "Invalid userId");
  }
  const video = await Video.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(videoId),
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "video",
        as: "likes",
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $lookup: {
              from: "subscriptions",
              localField: "_id",
              foreignField: "channel",
              as: "subscribers",
            },
          },
          {
            $addFields: {
              subscribersCount: {
                $size: "$subscribers",
              },
              isSubscribed: {
                $cond: {
                  if: {
                    $in: [req.user?._id, "$subscribers.subscriber"],
                  },
                  then: true,
                  else: false,
                },
              },
            },
          },
          {
            $project: {
              username: 1,
              "avatar.url": 1,
              subscribersCount: 1,
              isSubscribed: 1,
            },
          },
        ],
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
            if: { $in: [req.user?._d, "$likes.likedBy"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        "videoFile.url": 1,
        title: 1,
        description: 1,
        views: 1,
        createdAt: 1,
        duration: 1,
        comments: 1,
        owner: 1,
        likesCount: 1,
        isLiked: 1,
      },
    },
  ]);
  //if not video model found
  if (!video) {
    throw new ApiError(500, "failed to fetch video");
  }
  //increment views of videos if successfully uploaded
  await Video.findByIdAndUpdate(videoId, {
    $inc: {
      views: 1,
    },
  });
  //add this video in watch history
  await User.findByIdAndUpdate(req.user?._id, {
    $addToSet: {
      watchHistory: videoId,
    },
  });
  //send data to frontend
  return res
    .status(200)
    .json(new ApiResponse(200, video[0], "video details fetched successfully"));
});

// update video details like title, description, thumbnail
const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //get title and description
  const { title, description } = req.body;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid videoId");
  }
  //if not received
  if (!(title && description)) {
    throw new ApiError(400, "title and description are required");
  }
  //get video information from database
  const video = await Video.findById(videoId);
  //if not found in database
  if (!video) {
    throw new ApiError(404, "No video found");
  }
  //match video owner or not
  if (video?.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(
      400,
      "You cannot edit this video because you are not the owner"
    );
  }
  //store temperory to delete after successfully updated
  const thumbnailToDelete = video.thumbnail.public_id;
  //set new thumbnail
  const thumbnailLocalPath = req.file?.path;
  //if not any thumbnail path received
  if (!thumbnailLocalPath) {
    throw new ApiError(400, "thumbnail is required");
  }
  //upload the thumbnail to cloudinary database
  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
  //if not found or having some issues on uploading on cloudinary
  if (!thumbnail) {
    throw new ApiError("thumbnail not found");
  }
  // update the video information on database
  const updatedVideo = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        title,
        description,
        thumbnail: {
          public_id: thumbnail.public_id,
          url: thumbnail.url,
        },
      },
    },
    {
      new: true,
    }
  );
  //if not updated video found then some issues
  if (!updateVideo) {
    throw new ApiError(500, "Failed to upload video, Please try again");
  }
  //after updated delete image also from cloudinary
  if (updateVideo) {
    await deleteOnCloudinary(thumbnailLocalPath);
  }
  //send response to frontend
  return res
    .status(200)
    .json(new ApiResponse(200, "Video updated successfully"));
});
// delete video
const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //validate mongoose id
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid videoId");
  }
  //get video information by id
  const video = await Video.findById(videoId);
  //if information not exist
  if (!video) {
    throw new ApiError(404, "No video found");
  }
  //match the video owner or not
  if (video?.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(
      400,
      "You cannot delete this video because you are not the owner"
    );
  }
  //delete the video from mongoose database
  const videoDeleted = await Video.findByIdAndDelete(video?._id);
  //some issues video not deleted
  if (!videoDeleted) {
    throw new ApiError(400, "Failed to delete the video, Please try again");
  }
  //after deleted from mongoose also delete from cloudinary database
  await deleteOnCloudinary(video.thumbnail.public_id);
  await deleteOnCloudinary(video.videoFile.public_id, "video");

  //remove all video likes
  await Like.deleteMany({
    video: videoId,
  });
  //remove all video comments
  await Comment.deleteMany({
    video: videoId,
  });
  //send the data to frontend
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Video deleted Successfully"));
});
//toggle publish status
const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //validate mongoose id
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid videoId");
  }
  //get video information from mongoose database
  const video = await Video.findById(videoId);
  //if video not found
  if (!video) {
    throw new ApiError(404, "Video not found");
  }
  //match video owner or not
  if (video?.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(
      400,
      "You cannot publish this video because you are not the owner"
    );
  }
  //set toggle to published or not published
  const toggleVideoPublish = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        isPublished: !video?.isPublished,
      },
    },
    {
      new: true,
    }
  );
  //if not toggled video
  if (!toggleVideoPublish) {
    throw new ApiError(500, "Failed to toggled video publish status");
  }
  //send data to frontend
  return res.status(200).json(new ApiResponse(200, {isPublished: togglePublishStatus.isPublished}, "Video publish toggled successfully"))
});
export {
  getAllVideos,
  publishVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
