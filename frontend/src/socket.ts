import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export const getSocketId = (): string | null => {
  return socket?.id ?? null;
};
export const connectToRoom = (
  roomId: string,
  username: string,
  callbacks: {
    onSynced: (roomState: any) => void;
    onVideoPlay: (currentTime: number) => void;
    onVideoPause: (currentTime: number) => void;
    onVideoSeek: (currentTime: number) => void;
    onChatMessage: (message: {
      username: string;
      message: string;
      sentAt: number;
    }) => void;
    onChatHistory: (
      messages: { username: string; message: string; sentAt: number }[],
    ) => void;
    onVoiceOffer: (
      fromUserId: string,
      offer: RTCSessionDescriptionInit,
    ) => void;
    onVoiceAnswer: (
      fromUserId: string,
      answer: RTCSessionDescriptionInit,
    ) => void;
    onVoiceIceCandidate: (
      fromUserId: string,
      candidate: RTCIceCandidateInit,
    ) => void;
    onVoiceUserJoined: (userId: string) => void;
    onUserJoined: (userId: string, username: string) => void;
    onUserLeft: (userId: string) => void;
  },
) => {
  socket = io("http://localhost:3000");

  socket.on("connect", () => {
    socket!.emit("room:join", { roomId, username });
  });

  socket.on("connect_error", (error) => {
    console.log("Connection error:", error.message);
  });

  socket.on("room:sync", (roomState) => {
    console.log("Received room state:", roomState);
    sessionStorage.setItem(
      "roomState",
      JSON.stringify({ ...roomState, roomId, username }),
    );
    callbacks.onSynced(roomState);
  });

  socket.on("video:play", ({ currentTime, sentAt }) => {
    const latency = (Date.now() - sentAt) / 1000;
    const correctedTime = currentTime + latency;
    callbacks.onVideoPlay(correctedTime);
  });

  socket.on("video:pause", ({ currentTime }) => {
    callbacks.onVideoPause(currentTime);
  });

  socket.on("video:seek", ({ currentTime }) => {
    callbacks.onVideoSeek(currentTime);
  });

  socket.on(
    "chat:history",
    (messages: { username: string; message: string; sentAt: number }[]) => {
      callbacks.onChatHistory(messages);
    },
  );
  socket.on("chat:message", ({ username, message, sentAt }) => {
    callbacks.onChatMessage({ username, message, sentAt });
  });

  socket.on("webrtc:offer", ({ fromUserId, offer }) => {
    callbacks.onVoiceOffer(fromUserId, offer);
  });

  socket.on("webrtc:answer", ({ fromUserId, answer }) => {
    callbacks.onVoiceAnswer(fromUserId, answer);
  });

  socket.on("webrtc:ice-candidate", ({ fromUserId, candidate }) => {
    callbacks.onVoiceIceCandidate(fromUserId, candidate);
  });

  socket.on("webrtc:user-joined-voice", ({ userId }) => {
    // If we are already in voice, we don't do anything.
    // The NEW person will send US the offer.
    callbacks.onVoiceUserJoined(userId);
  });

  socket.on("user:joined", ({ id, username }) => {
    callbacks.onUserJoined(id, username);
  });

  socket.on("user:left", ({ userId }) => {
    callbacks.onUserLeft(userId);
  });
};

// Outgoing events
export const emitVideoPlay = (roomId: string, currentTime: number) => {
  socket?.emit("video:play", { roomId, currentTime, sentAt: Date.now() });
};

export const emitVideoPause = (roomId: string, currentTime: number) => {
  socket?.emit("video:pause", { roomId, currentTime });
};

export const emitVideoSeek = (roomId: string, currentTime: number) => {
  socket?.emit("video:seek", { roomId, currentTime });
};

export const emitChatMessage = (roomId: string, message: string) => {
  socket?.emit("chat:message", { roomId, message });
};

// Outgoing WebRTC signaling
export const emitVoiceOffer = (
  toUserId: string,
  offer: RTCSessionDescriptionInit,
) => {
  socket?.emit("webrtc:offer", { toUserId, offer });
};

export const emitVoiceAnswer = (
  toUserId: string,
  answer: RTCSessionDescriptionInit,
) => {
  socket?.emit("webrtc:answer", { toUserId, answer });
};

export const emitIceCandidate = (
  toUserId: string,
  candidate: RTCIceCandidateInit,
) => {
  socket?.emit("webrtc:ice-candidate", { toUserId, candidate });
};
