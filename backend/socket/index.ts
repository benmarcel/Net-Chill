import { registerChatHandlers } from "./handlers/chat.handler.js";
import  {registerVideoHandlers} from "./handlers/video.handler.js";
import { registerRoomHandlers } from "./handlers/room.handler.js";
import { Server } from "socket.io";
import { registerWebRTCHandlers } from "./handlers/webRtc.handler.js";
export function initSocket (io: Server) {
    console.log("Initializing Socket.IO handlers");
    io.on("connection", (socket) =>{
        registerRoomHandlers(io, socket);
        registerVideoHandlers(io, socket);
        registerChatHandlers(io, socket);
        registerWebRTCHandlers(io, socket);
    })
}