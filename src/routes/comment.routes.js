import { Router } from "express";
import {
  addComment,
  deleteComment,
  getVideoComments,
  updateComment,
} from "../controllers/comment.controllers.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();
const securedRoute = router.use(verifyJWT);

securedRoute.route("/:videoId").get(getVideoComments).post(addComment);
securedRoute.route("/c/:commentId").delete(deleteComment).patch(updateComment);

export default router;
