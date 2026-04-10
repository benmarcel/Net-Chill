import { rooms, type RoomState, type User } from "../store/room.store.js";
import { v4 as uuidv4 } from "uuid";

// Create a new room
export const roomService = {
// Called when someone pastes a YouTube link
  createRoom: (videoUrl: string) => {
    const id = uuidv4();
    const newRoom: RoomState = {
      id,
      videoUrl,
      currentTime: 0,
      isPlaying: false,
      lastUpdate: Date.now(),
      users: new Map(),
      createdAt: new Date(),
    };

    rooms.set(id, newRoom);
    return newRoom;
  },

  // Called when someone joins via the room URL
  getRoom: (roomId: string) => {
    return rooms.get(roomId);
  },

   // Called when a socket connects to a room
  addNewUser: (roomId: string, user: User) => {
    const room = rooms.get(roomId);

    if (room) {
      room.users.set(user.id, user);
    }
  },

  // Called when a socket disconnects
 removeUser: (roomId: string, userId: string) => {
  const room = rooms.get(roomId);
  if (room) {
    room.users.delete(userId);
    if (room.users.size === 0) {
      // Wait 60 seconds before checking again
      setTimeout(() => {
        const checkRoom = rooms.get(roomId);
        if (checkRoom && checkRoom.users.size === 0) {
          rooms.delete(roomId);
          console.log("Room cleaned up after inactivity");
        }
      }, 60000); 
    }
  }
},

  updateVideoState: (
    roomId: string,
    currentTime: number,
    isPlaying: boolean | null,
    lastUpdate: number = Date.now()
  ): void => {
    const room = rooms.get(roomId);
    if (room) {
      room.currentTime = currentTime;
      room.lastUpdate = lastUpdate;
      // Only update isPlaying if a boolean (true/false) was actually provided
      if (isPlaying !== null) {
        room.isPlaying = isPlaying;
      }
    }
  },
};
