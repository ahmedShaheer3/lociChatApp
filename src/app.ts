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

// const users: Record<string, string> = {};
// interface User {
//   userId: string;
//   socketId: string;
// }
ioClient.on(ChatEventEnum.CONNECTION_EVENT, (socket: Socket) => {
  console.log("New user connected", socket.id);
  console.log("New user connected", socket.data);

  // Handle user connection and store socket ID
  socket.on(ChatEventEnum.CONNECTED_EVENT, ({ userId }: { userId: string }) => {
    console.log("🚀 ~ socket.on ~ userId:", userId);
    socket.data._id = userId;
    socket.join(userId);
    socket.emit(ChatEventEnum.SERVER_MESSAGE, "You have connected to server and ready to go. !!!!!");
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

  // User starts typing in a one-on-one chat
  socket.on(ChatEventEnum.STOP_TYPING_EVENT, (chatId) => {
    socket.in(chatId).emit(ChatEventEnum.STOP_TYPING_EVENT, chatId);
  });

  // User starts typing in a one-on-one chat
  socket.on(ChatEventEnum.START_TYPING_EVENT, (chatId) => {
    socket.in(chatId).emit(ChatEventEnum.START_TYPING_EVENT, chatId);
  });

  // user send message
  socket.on(ChatEventEnum.MESSAGE, ({ message, recipientId }) => {
    console.log("🚀backend ~ socket.on ~ roomId:message", message, recipientId);
    // Emit the message to the recipient's room
    ioClient.to(recipientId).emit("receiveMessage", {
      senderId: socket.data._id,
      message,
    });

    console.log("user message send");
  });

  // User leaves a room
  socket.on(ChatEventEnum.LEAVE_CHAT_EVENT, ({ chatRoom, userId }: { chatRoom: string; userId: string }) => {
    socket.leave(chatRoom);
    console.log(`User ${userId} left room: ${chatRoom}`);
  });

  // Handle user disconnect
  socket.on(ChatEventEnum.DISCONNECT_EVENT, () => {
    console.log("Client disconnected", socket.id);
    if (socket.data?._id) {
      socket.leave(socket.data._id);
    }
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
