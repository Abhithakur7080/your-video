import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { cloudinaryUploading } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshToken = async (userId) => {
  try {
    //get user from database
    const user = await User.findById(userId);
    //generate access token
    const accessToken = user.generateAccessToken();
    //generate refresh token
    const refreshToken = user.generateRefreshToken();

    //save refresh token to database
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    //after save return both generated access and refresh token
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating refresh and access token"
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
    //get user details from frontend
  const { fullName, email, username, password } = req.body;
    //validation - not empty and ....
  //   if (fullName === "") {
  //     throw new ApiError();
  //   }

  if (
    [fullName, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }
  //check if already exists: username, email
  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (existedUser) {
    throw new ApiError(409, "User with email or username already exists");
  }
  //check images and or available or not
  const avatarLocalPath = req.files?.avatar[0]?.path;
  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files?.coverImage[0]?.path;
  }
  // const coverImageLocalPath = req.files?.coverImage[0]?.path;
    if (!avatarLocalPath) {
      throw new ApiError(400, "Avatar file is required");
    }

  const avatar = await cloudinaryUploading(avatarLocalPath, "users");
  const coverImage = await cloudinaryUploading(coverImageLocalPath, "users");

  if (!avatar) {
    throw new ApiError(400, "Avatar file is required");
  }
  //create user object - create entry in db
  const user = await User.create({
    fullName,
    avatar: {
      public_id: avatar.public_id,
      url: avatar.url,
    },
    coverImage: coverImage
      ? {
          public_id: coverImage.public_id,
          url: coverImage.url,
        }
      : null,
    email,
    password,
    username: username.toLowerCase(),
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  //check for user creation
  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }
//return response
  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  //get data from user req.body-> data
  const { email, username, password } = req.body;
  //check username or email
  if (!username && !email) {
    throw new ApiError(400, "username or password is required");
  }
  //find user from database
  const user = await User.findOne({
    $or: [{ username }, { email }],
  });
  //check user available or not
  if (!user) {
    throw new ApiError(404, "User doesn't exist");
  }
  //password check
  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid username or password");
  }
  //get access and refresh token
  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  //again get user data from database
  //we have two options get user from database or update already user available will previously called
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  //send cookie
  //set frontend cannot be modify it is secured
  const options =  {
    httpOnly: true, 
    secure: process.env.NODE_ENV === 'production',  // Only send cookies over HTTPS in production
    sameSite: 'None',  // Adjust as needed, 'lax' is often enough for most use cases
  };
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged Successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    //also correct but sometimes throw error due to null or undefined
    // {
    //   $set: {
    //     refreshToken: undefined,
    //   },
    // },
    {
      $unset: {
        refreshToken: 1, //it removes the fields from the document
      },
    },
    {
      new: true,
    }
  );
  const options =  {
  httpOnly: true, 
  secure: process.env.NODE_ENV === 'production',  // Only send cookies over HTTPS in production
  sameSite: 'None',  // Adjust as needed, 'lax' is often enough for most use cases
};
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "user logged out successfully"));
});

const updateAccountDetail = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;
  if (!fullName || !email) {
    throw new ApiError(400, "All fields are required");
  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName: fullName,
        email: email,
      },
    },
    {
      new: true,
    }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is missing");
  }

  const avatar = await cloudinaryUploading(avatarLocalPath, "users");
  if (!avatar.url) {
    throw new ApiError(400, "Error while uploading avatar");
  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: {
          public_id: avatar.public_id,
          url: avatar.url,
        },
      },
    },
    {
      new: true,
    }
  ).select("-password");
  return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar Updated Successfully"));
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;
  if (!coverImageLocalPath) {
    throw new ApiError(400, "Cover Image file is missing");
  }
  const coverImage = await cloudinaryUploading(coverImageLocalPath, "users");
  if (!coverImage.url) {
    throw new ApiError(400, "Error while uploading cover image");
  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: {
          public_id: coverImage.public_id,
          url: coverImage.url,
        },
      },
    },
    {
      new: true,
    }
  ).select("-password");
  return res
    .status(200)
    .json(new ApiResponse(200, user, "Cover Image Updated Successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  try {
    //get token
    const getToken = req.cookies?.refreshToken || req.body?.refreshToken;
    if (!getToken) {
      throw new ApiError(401, "Unauthorized request");
    }
    const decodedGetToken = jwt.verify(
      getToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    const user = await User.findById(decodedGetToken?._id);
    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }
    if (getToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }
    const options = {
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production',  // Only send cookies over HTTPS in production
      sameSite: 'None',  // Adjust as needed, 'lax' is often enough for most use cases
    };
    const { accessToken, newRefreshToken } =
      await generateAccessAndRefreshToken(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(200, { accessToken, refreshToken: newRefreshToken })
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  //get passwords from body and if also confirm password available
  const { oldPassword, newPassword, confirmPassword } = req.body;
  if (newPassword !== confirmPassword) {
    throw new ApiError(400, "Incorrect Password");
  }
  //find user from database
  const user = await User.findById(req.user?._id);
  //check password is correct or not
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
  //if not then return with error
  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid Old Password");
  }
  //set password
  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "password changed successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Current user fetched successfully"));
});


export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetail,
  updateUserAvatar,
  updateUserCoverImage,
};
