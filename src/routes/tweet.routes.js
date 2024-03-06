import { Router } from "express";
import {
  createTweet,
  deleteTweet,
  updateTweet,
  getUserTweet,
} from "../controllers/tweet.controllers.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

const securedRoute = router.use(verifyJWT);

securedRoute.route("/").post(createTweet);
securedRoute.route("/user/:userId").get(getUserTweet);
securedRoute.route("/:tweetId").patch(updateTweet).delete(deleteTweet);

export default router;
