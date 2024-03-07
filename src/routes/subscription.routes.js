import { Router } from "express";
import {
  getSubscribedChannel,
  getUserChannelSubscribers,
  toggleSubscription,
} from "../controllers/subscription.controllers.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();
const securedRoute = router.use(verifyJWT);
securedRoute
  .route("/c/:channelId")
  .get(getSubscribedChannel)
  .post(toggleSubscription);

securedRoute.route("/u/:subscriberId").get(getUserChannelSubscribers);

export default router;