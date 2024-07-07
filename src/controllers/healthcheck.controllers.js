import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// build health check response that simply returns the ok status code as json with a message
const healthCheck = asyncHandler(async (req, res) => {
  return res.status(200).json(
    new ApiResponse(
      200,
      {
        message: "Everything is O.K",
      },
      "OK"
    )
  );
});
export { healthCheck };
