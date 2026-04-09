// chat message events

// server/socket/handlers/chat.handler.ts
import { Server, Socket } from 'socket.io';
import { roomService } from '../../services/room.service.ts';
import { addChatMessage, getChatMessages } from '../../services/chat.service.ts';
export function registerChatHandlers(io: Server, socket: Socket) {

  socket.on('chat:message', ({ roomId, message }) => {
    const room = roomService.getRoom(roomId);
    if (!room) return;

    const user = room.users.get(socket.id);
    if (!user) return;
    console.log(`Received chat message from ${user.username} in room ${roomId}: ${message}`);
    // Broadcast to EVERYONE including sender
    // (sender needs to see their own message appear)
    addChatMessage(roomId, {
      username: user.username,
      message,
      sentAt: Date.now(),
      roomId
    });
    io.to(roomId).emit('chat:message', {
      username: user.username,
      message,
      sentAt: Date.now(),
      roomId
    });
  });
}