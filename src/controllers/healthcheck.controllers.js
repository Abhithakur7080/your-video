import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";

const healthCheck = asyncHandler(async (req, res) => {
  //TODO: build health check response that simply returns the ok status code as json with a message
});
export { healthCheck };
