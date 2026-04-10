// join/leave room events
import { Socket, Server } from "socket.io";
import { roomService } from "../../services/room.service.js";
import { getChatMessages } from "../../services/chat.service.js";
// import { rooms } from "../../store/room.store";

export function registerRoomHandlers(io: Server, socket: Socket) {
  socket.on("room:join", ({ roomId, username }) => {
    const room = roomService.getRoom(roomId);

    if (!room) {
      socket.emit("room:error", { message: "Room not found" });
      return;
    }

    roomService.addNewUser(roomId, { id: socket.id, username });
    socket.join(roomId);
    let currentTime = room.currentTime;

    if (room.isPlaying) {
      const elapsed = (Date.now() - room.lastUpdate) / 1000;
      currentTime += elapsed;
    }
    // Only THIS user gets the current state
    socket.emit("room:sync", {
      videoUrl: room.videoUrl,
      currentTime,
      isPlaying: room.isPlaying,
      sentAt: Date.now(),
      users: Array.from(room.users.values()),
    });
    socket.emit("chat:history", getChatMessages(roomId));
    // Everyone ELSE gets notified someone joined
    socket.to(roomId).emit("user:joined", {
      username,
      userId: socket.id,
    });
  });

  socket.on("disconnecting", () => {
    // check which rooms the socket is part of before it disconnects
    for (const roomId of socket.rooms) {
      if (roomId === socket.id) continue;

      const room = roomService.getRoom(roomId);
      if (!room) continue;

      const user = room.users.get(socket.id);
      roomService.removeUser(roomId, socket.id);

      socket
        .to(roomId)
        .emit("user:left", { username: user?.username, id: socket.id });
    }
  });
}
