import { Server, Socket } from "socket.io";

export function registerWebRTCHandlers(io: Server, socket: Socket) {

  // Forward offer to a specific user
  socket.on("webrtc:offer", ({ toUserId, offer }) => {
    // toUserId is the socket.id of the person we want to connect to
    // we send it directly to them, not to the whole room
    io.to(toUserId).emit("webrtc:offer", {
      fromUserId: socket.id,
      offer,
    });
  });

  // Forward answer to a specific user
  socket.on("webrtc:answer", ({ toUserId, answer }) => {
    io.to(toUserId).emit("webrtc:answer", {
      fromUserId: socket.id,
      answer,
    });
  });

  // Forward ICE candidate to a specific user
  socket.on("webrtc:ice-candidate", ({ toUserId, candidate }) => {
    io.to(toUserId).emit("webrtc:ice-candidate", {
      fromUserId: socket.id,
      candidate,
    });
  });
}