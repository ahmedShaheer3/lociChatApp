import express, { Express, Request, Response, json, urlencoded } from "express";
import cors from "cors";

import userApis from "./routes/userRoutes";
import connectionApis from "./routes/connectionRoutes";
import postApis from "./routes/postRoutes";
import notificationApis from "./routes/notificationRoutes";
import reactionApis from "./routes/reactionRoute";
import commentApis from "./routes/commentRoutes";
import reportApis from "./routes/reportRoutes";

import logger from "./utils/logger";
import morgan from "morgan";

const app: Express = express();
const morganFormat = ":method :url :status :response-time ms";
/*
 ** Middlewares
 */
app.use(cors());
app.use(json());

app.use(urlencoded({ limit: "100mb", extended: true, parameterLimit: 50000 }));

app.use(
  morgan(morganFormat, {
    stream: {
      write: (message) => {
        const logObject = {
          method: message.split(" ")[0],
          url: message.split(" ")[1],
          status: message.split(" ")[2],
          responseTime: message.split(" ")[3],
        };
        logger.info(JSON.stringify(logObject));
      },
    },
  }),
);

app.get("/", (req: Request, res: Response) => {
  return res.status(200).json({ success: true, greeting: "Hello / from API" });
});
/*
 ** Routers
 *
 */
app.use("/api/v1/user", userApis);
app.use("/api/v1/connection", connectionApis);
app.use("/api/v1/post", postApis);
app.use("/api/v1/notification", notificationApis);
app.use("/api/v1/reaction", reactionApis);
app.use("/api/v1/comment", commentApis);
app.use("/api/v1/report", reportApis);

// middleware to return response of URL NOT FOUND
app.use((req: Request, res: Response) => {
  console.log("🚀 ~ app.use ~ res:", res);
  console.log("🚀 ~ app.use ~ req:", req);
  return res.status(404).json({
    error: true,
    message: "route not found",
  });
});

export { app };

// TODO: morgan
// TODO: chat app
// TODO: logging solutions
