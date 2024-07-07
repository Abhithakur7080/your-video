import { Router } from "express";
//controllers from users
import {
  getUserChannelProfile,
  getWatchHistory,
} from "../controllers/user.controllers.js";
// middlewares
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

//http://localhost:0000/api/v1/user/

//secured routes
const securedRoute = router.use(verifyJWT);

securedRoute.route("/c/:username").get(getUserChannelProfile);

securedRoute.route("/watch-history").get(getWatchHistory);

export default router;
