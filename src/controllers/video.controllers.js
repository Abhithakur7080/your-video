import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
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
  //check ans also show some owner details
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
  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video fetched successfully"));
});

const publishVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;

  // get video upload to cloudinary, create video
  if ([title, description].some(field => field?.trim() === "")) {
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
  //after successfull create a video model
  const video = await Video.create({
    title,
    description,
    duration: videoFile.duration,
    videoFileL: {
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
  if(!videoUploaded){
    throw new ApiError(500, "video upload failed please try again !!!")
  }
  return res.status(200).json(new ApiResponse(200, "Video uploaded successfully"))
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //validate mongoose video id
  if(!isValidObjectId(videoId)){
    throw new ApiError(400, "Invalid videoId");
  }
  //validate mongoose user id
  if(!isValidObjectId(req.user?._id)){
    throw new ApiError(400, "Invalid userId");
  }
  const video = await Video.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(videoId)
      }
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "video",
        as: "likes"
      }
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
              as: "subscribers"
            }
          },
          {
            $addFields: {
              subscribersCount: {
                $size: "$subscribers"
              },
              isSubscribed: {
                $cond: {
                  if: {
                    $in: [req.user?._id, "$subscribers.subscriber"]
                  },
                  then: true,
                  else: false
                }
              }
            }
          },
          {
            $project: {
              username: 1,
              "avatar.url": 1,
              subscribersCount: 1,
              isSubscribed: 1
            }
          }
        ]
      }
    },
    {
      $addFields: {
        likesCount: {
          $size: "$likes"
        },
        owner: {
          $first: "$owner"
        },
        isLiked: {
          $cond: {
            if: {$in: [req.user?._d, "$likes.likedBy"]},
            then: true,
            else: false
          }
        }
      }
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
        isLiked: 1
      }
    }
  ])
  //if not video model found
  if(!video){
    throw new ApiError(500, "failed to fetch video")
  }
  //increment views of videos if successfully uploaded
  await Video.findByIdAndUpdate(videoId, {
    $inc: {
      views: 1
    }
  });
  //add this video in watch history
  await User.findByIdAndUpdate(req.user?._id, {
    $addToSet: {
      watchHistory: videoId
    }
  });
  return res.status(200).json(new ApiResponse(200, video[0], "video details fetched successfully"))
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: update video details like title, description, thumbnail
});
const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: delete video
});
const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: toggle publish status
});
export {
  getAllVideos,
  publishVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
