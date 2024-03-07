import { Router } from "express";
import {
  addVideoToPlaylist,
  createPlaylist,
  deletePlaylist,
  getPlaylistById,
  getUserPlaylists,
  removeVideoFromPlaylist,
  updatePlaylist,
} from "../controllers/playlist.controllers.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();
const securedRoute = router.use(verifyJWT);
securedRoute.route("/").post(createPlaylist);
securedRoute
  .route("/:playlistId")
  .get(getPlaylistById)
  .patch(updatePlaylist)
  .delete(deletePlaylist);

securedRoute.route("/add/:videoId/:playlistId").patch(addVideoToPlaylist);
securedRoute
  .route("/delete/:videoId/:playlistId")
  .patch(removeVideoFromPlaylist);

securedRoute.route("/user/:userId").get(getUserPlaylists);

export default router