// server/store/room.store.ts
export interface User {
  id: string;          // socket.id
  username: string;
}

export interface RoomState {
  id: string;
  videoUrl: string;
  currentTime: number;   // where in the video we are (seconds)
  isPlaying: boolean;
  lastUpdate: number;     // when was the last play/pause/seek event
  users: Map<string, User>;
  createdAt: Date;
}

// The database — just a Map in memory
export const rooms = new Map<string, RoomState>();

