import express, { Express, Request, Response, json, urlencoded } from "express";
import { Server as SocketServer } from "socket.io";
import cors from "cors";
import { createServer } from "http";

import chatApis from "./routes/chatRoutes";

import logger from "./utils/logger";
import morgan from "morgan";
import { initializeSocketIO } from "./socket";

const app: Express = express();
const httpServer = createServer(app);
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
        console.log("🚀 ~ message:", message);
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
const ioClient = new SocketServer(httpServer, {
  pingTimeout: 60000,
  connectionStateRecovery: {},
  transports: ["websocket"],
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.set("ioClient", ioClient);
app.get("/", (req: Request, res: Response) => {
  return res.status(200).json({ success: true, greeting: "Hello / from API" });
});
/*
 ** Routers
 *
 */
app.use("/api/v1/chat", chatApis);

// Socket clinet initialer
initializeSocketIO(ioClient);

// middleware to return response of URL NOT FOUND
app.use((req: Request, res: Response) => {
  console.log("🚀 ~ app.use ~ res:", res);
  console.log("🚀 ~ app.use ~ req:", req);
  return res.status(404).json({
    error: true,
    message: "route not found",
  });
});

export { httpServer };

// TODO: morgan
// TODO: real time chat app
// TODO: group chat
// TODO: logging solutions
// TODO: UNread count
// TODO: online/offline status
// TODO: optamise read/unread count
// TODO: last seen status
