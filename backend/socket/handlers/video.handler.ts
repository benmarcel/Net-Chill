// play/pause/seek events
import { Socket, Server } from "socket.io";
import { roomService } from "../../services/room.service.js";

export function registerVideoHandlers(io: Server, socket: Socket) {
  socket.on("video:play", ({ roomId, currentTime }) => {
    roomService.updateVideoState(roomId, currentTime, true);
    socket.to(roomId).emit("video:play", { currentTime, sentAt: Date.now() });
  });

  socket.on("video:pause", ({ roomId, currentTime }) => {
    roomService.updateVideoState(roomId, currentTime, false);
    socket.to(roomId).emit("video:pause", { currentTime, sentAt: Date.now() });
  });

  socket.on("video:seek", ({ roomId, currentTime }) => {
    roomService.updateVideoState(roomId, currentTime, null); // don't change play/pause state
    socket.to(roomId).emit("video:seek", { currentTime, sentAt: Date.now() });
  });
}
