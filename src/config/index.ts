export const FCM_URL = "";
export const FCM_SERVER_KEY = "";
export const API_BYPASS_KEY = "674536e5-cbc9-46d2-9d7a-8b774b195a2c";
const DATABASE_USER = "shaheerahmed";
const DATABASE_PASSWORD = "Admin1234";
export const USER_POOL_ID = "us-east-1_xkg9tK19V";
export const CLIENT_ID = "2t2p949cr3h1mfgju93nt552pv";

export const DATABASE_URL = `mongodb+srv://${DATABASE_USER}:${DATABASE_PASSWORD}@cluster0.mikutli.mongodb.net/loci-dev?retryWrites=true&w=majority&appName=Cluster0`;

export const STATUS_CODE = {
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  SUCCESS: 200,
  NOT_FOUND: 404,
  NOT_ACCEPTABLE: 406,
  INTERNAL_SERVER: 500,
  CONFLICT_DATA: 409,
};

/**
 * @description set of events that we are using in chat app. more to be added as we develop the chat app
 */
export const ChatEventEnum = Object.freeze({
  // ? once user is ready to go
  CONNECTION_EVENT: "connection",
  // ? once user is ready to go
  CONNECTED_EVENT: "connected",
  // ? when user gets disconnected
  DISCONNECT_EVENT: "disconnect",
  // ? when user joins a socket room
  JOIN_CHAT_EVENT: "joinChat",
  // ? when participant gets removed from group, chat gets deleted or leaves a group
  LEAVE_CHAT_EVENT: "leaveChat",
  // ? when admin updates a group name
  UPDATE_GROUP_NAME_EVENT: "updateGroupName",
  // ? when new message is received
  MESSAGE: "message",
  // ? when there is new one on one chat, new group chat or user gets added in the group
  NEW_CHAT_EVENT: "newChat",
  // ? when there is an error in socket
  SOCKET_ERROR_EVENT: "socketError",
  // ? when participant stops typing
  STOP_TYPING_EVENT: "stopTyping",
  // ? when participant get online
  USER_ONLINE_STATUS_EVENT: "userOnlineStatus",
  // ? when participant starts typing
  START_TYPING_EVENT: "startTyping",
  // ? when message is deleted
  MESSAGE_DELETE_EVENT: "messageDeleted",
  // ? whensending server message to user
  SERVER_MESSAGE: "serverMessage",
});

export const AvailableChatEvents = Object.values(ChatEventEnum);
