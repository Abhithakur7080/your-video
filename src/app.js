import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from 'morgan'
import { ApiError } from "./utils/ApiError.js";

//app creation
const app = express();
//CORS origin setup
app.use(
  cors({
    origin: process.env.CORS_ORIGIN.split(','),
    credentials: true,
  })
);
//app configuration
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());
app.use(morgan("dev"))


//routes imports
import authRouter from "./routes/auth.routes.js";
import userRouter from "./routes/user.routes.js";
import videoRouter from "./routes/video.routes.js";
import tweetRouter from "./routes/tweet.routes.js";
import subscriptionRouter from "./routes/subscription.routes.js";
import playlistRouter from "./routes/playlist.routes.js";
import likeRouter from "./routes/like.routes.js";
import healthcheckRouter from "./routes/healthcheck.routes.js";
import dashboardRouter from "./routes/dashboard.routes.js";
import commentRouter from "./routes/comment.routes.js";


//routes declaration
//http://localhost:0000/api/v1/users
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/user", userRouter);
app.use("/api/v1/video", videoRouter);
app.use("/api/v1/tweet", tweetRouter);
app.use("/api/v1/subscription", subscriptionRouter);
app.use("/api/v1/playlist", playlistRouter);
app.use("/api/v1/like", likeRouter);
app.use("/api/v1/healthcheck", healthcheckRouter);
app.use("/api/v1/dashboard", dashboardRouter);
app.use("/api/v1/comment", commentRouter);

app.use((err, req, res, next) => {
  if (err instanceof ApiError) {
      res.status(err.statusCode).json(err);
  } else {
      res.status(500).json({
          statusCode: 500,
          message: err.message || "Internal Server Error",
          success: false,
          errors: []
      });
  }
});

export { app };
