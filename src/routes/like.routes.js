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
securedRoute.route("toogle/v/:videoId").post(toggleVideoLike);
securedRoute.route("toogle/c/:commentId").post(toggleCommentsLike);
securedRoute.route("toogle/t/:tweetId").post(toggleTweetLike);
securedRoute.route("/videos").get(getLikedVideos);

export default router;
