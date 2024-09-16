import { Request } from "express";
import { ChatEventEnum } from "../config";
import { Server as SocketIOServer, Socket } from "socket.io";
/*
 ** Registering to an event so can user can joing chat rooms
 */
const mountJoinChatEvent = (socket: Socket) => {
  socket.on(ChatEventEnum.JOIN_CHAT_EVENT, (chatId: string) => {
    console.log(`User joined the chat 🤝. chatId: `, chatId);
    // joining the room with the chatId will allow specific events to be fired where we don't bother about the users like typing events
    // E.g. When user types we don't want to emit that event to specific participant.
    // We want to just emit that to the chat where the typing is happening
    socket.join(chatId);
  });
};
/*
 ** Registering to an event so that users know about typing
 */
const mountParticipantTypingEvent = (socket: Socket) => {
  socket.on(ChatEventEnum.START_TYPING_EVENT, (chatId: string) => {
    socket.in(chatId).emit(ChatEventEnum.STOP_TYPING_EVENT, {
      user: socket.data._id,
    });
  });
};
/*
 ** Registering to an event so that users know about typing
 */
const mountParticipantStoppedTypingEvent = (socket: Socket) => {
  socket.on(ChatEventEnum.STOP_TYPING_EVENT, (chatId: string) => {
    socket.in(chatId).emit(ChatEventEnum.STOP_TYPING_EVENT, {
      user: socket.data._id,
    });
  });
};
/*
 **  returing ioClinet
 */
const initializeSocketIO = (ioClient: SocketIOServer) => {
  return ioClient.on(ChatEventEnum.CONNECTION_EVENT, (socket: Socket) => {
    try {
      console.log("New user connected", socket.id);

      // Handle user connection and store socket ID
      socket.on(ChatEventEnum.CONNECTED_EVENT, ({ userId }: { userId: string }) => {
        console.log("🚀 ~ socket.on ~ userId:", userId);
        socket.data._id = userId;
        socket.join(userId);
        socket.emit(ChatEventEnum.SERVER_MESSAGE, "You have connected to server and ready to go. !!!!!");
        console.log(`User ${userId} connected with socket ID: ${socket.id}`);
      });

      // Common events that needs to be mounted on the initialization
      mountJoinChatEvent(socket);
      mountParticipantTypingEvent(socket);
      mountParticipantStoppedTypingEvent(socket);

      // user send message
      socket.on(ChatEventEnum.MESSAGE, ({ message, userId }) => {
        console.log("🚀backend ~ socket.on ~ roomId:message", message, userId);

        // Emit the message to the recipient's room
        ioClient.to(userId).emit(ChatEventEnum.MESSAGE, {
          userId: socket.data._id,
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
    } catch (error: unknown) {
      console.log("🚀 ~ returnioClient.on ~ error:", error);
      socket.emit(
        ChatEventEnum.SOCKET_ERROR_EVENT,
        (error as Error)?.message || "Something went wrong while connecting to the socket.",
      );
    }
  });
};

// Utility function responsible to abstract the logic of socket emission via the io instance
// and sending event into it
const emitSocketEvent = (req: Request, roomId: string, event: string, payload: string | object) => {
  req.app.get("ioClient").in(roomId).emit(event, payload);
};

export { initializeSocketIO, emitSocketEvent };
