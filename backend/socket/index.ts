import { registerChatHandlers } from "./handlers/chat.handler.ts";
import  {registerVideoHandlers} from "./handlers/video.handler.ts";
import { registerRoomHandlers } from "./handlers/room.handler.ts";
import { Server } from "socket.io";
import { registerWebRTCHandlers } from "./handlers/webRtc.handler.ts";
export function initSocket (io: Server) {
    console.log("Initializing Socket.IO handlers");
    io.on("connection", (socket) =>{
        registerRoomHandlers(io, socket);
        registerVideoHandlers(io, socket);
        registerChatHandlers(io, socket);
        registerWebRTCHandlers(io, socket);
    })
}