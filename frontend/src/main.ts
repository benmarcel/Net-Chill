import { initializePlayer, syncPlay, syncPause, syncSeek } from "./youtube";
import {
  connectToRoom,
  emitVideoPlay,
  emitVideoPause,
  emitVideoSeek,
  emitChatMessage,
} from "./socket";
import {
  joinVoice,
  handleAnswer,
  handleIceCandidate,
  handleOffer,
  leaveVoice,
} from "./webRtc";
import {
  emitVoiceOffer,
  emitVoiceAnswer,
  emitIceCandidate,
  getSocketId,
} from "./socket";
// import { standaloneInit } from "./youtube";
const videoUrlInput = document.getElementById(
  "video-url-input",
) as HTMLInputElement;
const usernameInput = document.getElementById(
  "username-input",
) as HTMLInputElement;
const createRoomBtn = document.getElementById(
  "create-room-btn",
) as HTMLButtonElement;
const videoSection = document.getElementById("video-section") as HTMLElement;
const landingPage = document.getElementById(
  "landing-page-container",
) as HTMLElement;
const shareableLinkInput = document.getElementById(
  "shareable-link-input",
) as HTMLInputElement;
const copyLinkBtn = document.getElementById(
  "copy-link-btn",
) as HTMLButtonElement;

const chatDisplay = document.getElementById("chat-messages") as HTMLElement;
const chatInput = document.getElementById("chat-input") as HTMLInputElement;
const chatSendBtn = document.getElementById("send-btn") as HTMLButtonElement;
const joinVoiceBtn = document.getElementById(
  "join-voice-chat-btn",
) as HTMLButtonElement;
// const videoPlayer = document.getElementById("video-player") as HTMLElement;

// Builds the callbacks object with roomId in scope
const buildCallbacks = (roomId: string) => ({
  onSynced: (roomState: any) => {
    // If server did not send videoUrl, it means this is a refresh, not a new join
    const savedSession = sessionStorage.getItem("roomState");
    const parsed = savedSession ? JSON.parse(savedSession) : {};

    const fullRoomState = {
      ...parsed, // fallback values from session
      ...roomState, // server values override if they exist
    };
    initializePlayer(fullRoomState, "video-player", {
      onPlay: (currentTime: number) => emitVideoPlay(roomId, currentTime),
      onPause: (currentTime: number) => emitVideoPause(roomId, currentTime),
      onSeek: (currentTime: number) => emitVideoSeek(roomId, currentTime),
    });
    showVideoSection();
    if (roomState.users) {
      roomState.users.forEach((user: any) => {
        if (user.id !== getSocketId()) {
          roomUsers.set(user.id, user.username);
        }
      });
    }
  },
  onVideoPlay: (currentTime: number) => syncPlay(currentTime),
  onVideoPause: (currentTime: number) => syncPause(currentTime),
  onVideoSeek: (currentTime: number) => syncSeek(currentTime),
  onChatMessage: ({
    username,
    message,
    sentAt,
  }: {
    username: string;
    message: string;
    sentAt: number;
  }) => {
    displayChatMessage(username, message, sentAt);
  },
  onChatHistory: (
    messages: { username: string; message: string; sentAt: number }[],
  ) => {
    displayChatHistory(messages);
  },

  onVoiceOffer: (fromUserId: string, offer: RTCSessionDescriptionInit) => {
    handleOffer(fromUserId, offer, voiceSignalingCallbacks);
  },

  onVoiceAnswer: (fromUserId: string, answer: RTCSessionDescriptionInit) => {
    handleAnswer(fromUserId, answer);
  },

  onVoiceIceCandidate: (fromUserId: string, candidate: RTCIceCandidateInit) => {
    handleIceCandidate(fromUserId, candidate);
  },

  onVoiceUserJoined: (userId: string) => {
    // A new user joined voice — they will send us an offer
    // We just wait — no action needed here
    console.log("User joined voice:", userId);
  },

  onUserJoined: (userId: string, username: string) => {
    roomUsers.set(userId, username);
    console.log("User joined room:", username);
  },

  onUserLeft: (userId: string) => {
    roomUsers.delete(userId);
     console.log("User left. roomUsers now:", roomUsers.size);
  },
});

const voiceSignalingCallbacks = {
  onOffer: (toUserId: string, offer: RTCSessionDescriptionInit) => {
    emitVoiceOffer(toUserId, offer);
  },
  onAnswer: (toUserId: string, answer: RTCSessionDescriptionInit) => {
    emitVoiceAnswer(toUserId, answer);
  },
  onIceCandidate: (toUserId: string, candidate: RTCIceCandidateInit) => {
    emitIceCandidate(toUserId, candidate);
  },
};

let currentRoomId: string | null = null;

const boot = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const sharedRoomId = urlParams.get("room");
  const title = document.querySelector("h2");
  const savedSession = sessionStorage.getItem("roomState");

  // Attach button listeners
  createRoomBtn.addEventListener("click", () => {
    if (sharedRoomId) {
      handleGuestSubmit(sharedRoomId);
    } else {
      handleHostSubmit();
    }
  });

  let inVoice = false;

  joinVoiceBtn?.addEventListener("click", async () => {
  console.log("roomUsers at click time:", roomUsers);
  console.log("roomUsers size:", roomUsers.size);
  console.log("existingUserIds:", getRoomUserIds());
  
  if (!inVoice) {
    const existingUserIds = getRoomUserIds();
    await joinVoice(existingUserIds, voiceSignalingCallbacks);
    inVoice = true;
    joinVoiceBtn.innerText = "🔴 Leave Voice";
  } else {
    leaveVoice();
    inVoice = false;
    joinVoiceBtn.innerText = "🎤 Join Voice";
  }
});

  copyLinkBtn?.addEventListener("click", () => {
    if (shareableLinkInput?.value) {
      navigator.clipboard.writeText(shareableLinkInput.value).then(() => {
        const originalText = copyLinkBtn.innerHTML;
        copyLinkBtn.innerText = "COPIED!";
        setTimeout(() => {
          copyLinkBtn.innerHTML = originalText;
        }, 2000);
      });
    }
  });

  // chat send-btn listener
  chatSendBtn.addEventListener("click", () => {
    const message = chatInput.value.trim();
    if (message && currentRoomId) {
      emitChatMessage(currentRoomId, message);
      chatInput.value = "";
    }
  });

  // Refresh path — user was already in a room
  if (savedSession) {
    const parsed = JSON.parse(savedSession);
    if (shareableLinkInput) {
      shareableLinkInput.value = `${window.location.origin}?room=${parsed.roomId}`;
    }
    connectToRoom(
      parsed.roomId,
      parsed.username,
      buildCallbacks(parsed.roomId),
    );
    return;
  }

  // Guest path — room in URL but no session
  if (sharedRoomId) {
    videoUrlInput.style.display = "none";
    if (title) title.innerText = "Join the Party.";
    if (createRoomBtn) {
      createRoomBtn.innerHTML = `
        <span>Join Video Room</span>
        <div class="w-10 h-10 md:w-8 md:h-8 rounded-full border border-cyan-400 
                    flex items-center justify-center group-hover:bg-cyan-400 
                    group-hover:text-black transition">
          ▶
        </div>`;
    }
  }
};

// Helper to get user IDs for voice connections
let roomUsers = new Map<string, string>(); // userId → username
const getRoomUserIds = (): string[] => {
  return Array.from(roomUsers.keys());
};

const handleHostSubmit = async () => {
  const videoUrl = videoUrlInput.value;
  const username = usernameInput.value;

  if (!videoUrl || !username) {
    alert("Please enter both a video URL and a username");
    return;
  }

  const room = await createVideoRoom(videoUrl);
  if (room) {
    currentRoomId = room.roomId;
    if (!currentRoomId) {
      alert("Failed to create room. Please try again.");
      return;
    }
    const newUrl = `${window.location.origin}?room=${currentRoomId}`;
    window.history.pushState({ path: newUrl }, "", newUrl);

    if (shareableLinkInput) shareableLinkInput.value = newUrl;

    connectToRoom(currentRoomId, username, buildCallbacks(currentRoomId));
  }
};

const handleGuestSubmit = (sharedRoomId: string) => {
  const username = usernameInput.value;
  currentRoomId = sharedRoomId;
  if (!username || !currentRoomId) {
    alert("Please enter a username and confirm room ID to join the room");
    return;
  }

  if (shareableLinkInput) {
    shareableLinkInput.value = `${window.location.origin}?room=${sharedRoomId}`;
  }

  connectToRoom(sharedRoomId, username, buildCallbacks(currentRoomId));
};

const createVideoRoom = async (videoUrl: string) => {
  try {
    const response = await fetch("http://localhost:3000/api/rooms/create", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ videoUrl }),
    });
    const data = await response.json();
    if (response.ok) return data.data;
  } catch (error) {
    console.error("Error creating video room:", error);
  }
};

const showVideoSection = () => {
  videoSection.classList.remove("hidden");
  videoSection.style.display = "flex";
  landingPage.style.display = "none";
};

const createChatMessageElement = (
  username: string,
  message: string,
  sentAt: number,
): HTMLDivElement => {
  const messageElem = document.createElement("div");
  messageElem.classList.add("mb-2");
  const time = new Date(sentAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  messageElem.innerHTML = `<strong>${username}</strong> <span class="text-xs text-gray-500">${time}</span><br>${message}`;
  return messageElem;
};

const displayChatMessage = (
  username: string,
  message: string,
  sentAt: number,
) => {
  const messageElem = createChatMessageElement(username, message, sentAt);
  chatDisplay.appendChild(messageElem);
  chatDisplay.scrollTop = chatDisplay.scrollHeight;
};

const displayChatHistory = (
  messages: { username: string; message: string; sentAt: number }[],
) => {
  const fragment = document.createDocumentFragment();

  messages.forEach((msg) => {
    const messageElem = createChatMessageElement(
      msg.username,
      msg.message,
      msg.sentAt,
    );
    fragment.appendChild(messageElem);
  });

  // Inject everything at once! (1 Reflow)
  chatDisplay.appendChild(fragment);

  // Scroll to bottom once at the very end
  chatDisplay.scrollTop = chatDisplay.scrollHeight;
};

// Initialize the app
boot();
// showVideoSection();
// standaloneInit(
//   "https://www.youtube.com/watch?v=U1B2sprdkGA",
//   "video-player"
// );
