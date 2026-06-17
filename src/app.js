import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import env from "./config/env.js";
import routes from "./routes/index.js";
import errorHandler from "./middleware/errorHandler.js";

function createApp() {
  const app = express();

  app.use(
    cors({
      origin: env.clientUrl,
      credentials: true,
    })
  );
  app.use(cookieParser());
  app.use(express.json());

  app.use("/api", routes);

  app.use(errorHandler);

  return app;
}

export default createApp;
