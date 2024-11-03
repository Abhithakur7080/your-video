import { Router } from "express";
import {
  getLikedVideos,
  toggleCommentsLike,
  toggleTweetLike,
  toggleVideoLike,
} from "../controllers/like.controllers.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
const router = Router();
const securedRoute = router.use(verifyJWT);
securedRoute.route("/toggle/v/:videoId").post(toggleVideoLike);
securedRoute.route("/toggle/c/:commentId").post(toggleCommentsLike);
securedRoute.route("/toggle/t/:tweetId").post(toggleTweetLike);
securedRoute.route("/videos").get(getLikedVideos);

export default router;
