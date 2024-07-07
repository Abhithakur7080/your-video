import { Router } from "express";
//controllers from auth
import {
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  changeCurrentPassword,
  getCurrentUser,
} from "../controllers/user.controllers.js";
// middlewares
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

//http://localhost:0000/api/v1/auth/register
router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
);
router.route("/login").post(loginUser);

router.route("/refresh-token").post(refreshAccessToken);

//secured routes
const securedRoute = router.use(verifyJWT);

securedRoute.route("/logout").post(logoutUser);

securedRoute.route("/change-password").post(changeCurrentPassword);

securedRoute.route("/current-user").get(getCurrentUser);

export default router;
