import express, { Express, Request, Response, json, urlencoded } from "express";
import { Server as SocketServer, Socket } from "socket.io";
import cors from "cors";
import { createServer } from "http";

import chatApis from "./routes/chatRoutes";

import logger from "./utils/logger";
import morgan from "morgan";
import { ChatEventEnum } from "./config";

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

const users: Record<string, string> = {};
interface User {
  userId: string;
  socketId: string;
}
ioClient.on(ChatEventEnum.CONNECTION_EVENT, (socket: Socket) => {
  console.log("New user connected", socket.id);

  // Handle user connection and store socket ID
  socket.on("connectedUser", ({ userId }: User) => {
    users[userId] = socket.id;
    console.log(`User ${userId} connected with socket ID: ${socket.id}`);
  });
  // user joined a room
  socket.on(ChatEventEnum.JOIN_CHAT_EVENT, (chatId) => {
    console.log(`User joined the chat 🤝. chatId: `, chatId);
    // joining the room with the chatId will allow specific events to be fired where we don't bother about the users like typing events
    // E.g. When user types we don't want to emit that event to specific participant.
    // We want to just emit that to the chat where the typing is happening
    socket.join(chatId);
  });
  // user starts typing
  socket.on(ChatEventEnum.TYPING_EVENT, (chatId) => {
    socket.in(chatId).emit(ChatEventEnum.TYPING_EVENT, chatId);
  });
  // user stops typing
  socket.on(ChatEventEnum.STOP_TYPING_EVENT, (chatId) => {
    socket.in(chatId).emit(ChatEventEnum.STOP_TYPING_EVENT, chatId);
  });
  // user send message
  socket.on(ChatEventEnum.MESSAGE_RECEIVED_EVENT, ({ chatRoomId, message }) => {
    console.log("🚀backend ~ socket.on ~ roomId:message", chatRoomId, message);
    socket.emitWithAck("roomMessage", { chatRoomId, message }, (err, response) => {
      if (err) {
        // the server did not acknowledge the event in the given delay
        console.log("ero: server did not acknowledge the event in the given delay");
      } else {
        console.log(response.status);
      }
    });
    console.log("user message send");
  });
  // User leaves a room
  socket.on("leaveRoom", ({ chatRoom, userId }: { chatRoom: string; userId: string }) => {
    socket.leave(chatRoom);
    console.log(`User ${userId} left room: ${chatRoom}`);
  });
});

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
// TODO: logging solutions
// TODO: UNread count
// TODO: typing indicator
// TODO: online/offline status
