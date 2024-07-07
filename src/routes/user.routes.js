import { Router } from "express";
//controllers from users
import {
  updateAccountDetail,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchHistory,
} from "../controllers/user.controllers.js";
// middlewares
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

//http://localhost:0000/api/v1/user/

//secured routes
const securedRoute = router.use(verifyJWT);

securedRoute.route("/update-account").patch(updateAccountDetail);

securedRoute.route("/avatar").patch(upload.single("avatar"), updateUserAvatar);

securedRoute
  .route("/cover-image")
  .patch(upload.single("coverImage"), updateUserCoverImage);

securedRoute.route("/c/:username").get(getUserChannelProfile);

securedRoute.route("/watch-history").get(getWatchHistory);

export default router;
