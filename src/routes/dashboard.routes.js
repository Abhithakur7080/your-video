import { Router } from "express";
import {
  getChannelStats,
  getChannelVideos,
} from "../controllers/dashboard.controllers.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();
const securedRoute = router.use(verifyJWT);

securedRoute.route("/stats").get(getChannelStats);
securedRoute.route("/videos").get(getChannelVideos);

export default router;
