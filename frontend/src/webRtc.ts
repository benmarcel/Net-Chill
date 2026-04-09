// WebRTC logic
// client/src/webrtc.ts

// STUN servers help each browser discover its public IP
// Google provides free STUN servers
const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

// One PeerConnection per remote user
// Key = their socket ID, Value = their RTCPeerConnection
const peerConnections = new Map<string, RTCPeerConnection>();

// Our microphone stream — shared across all connections
let localStream: MediaStream | null = null;

interface WebRTCCallbacks {
  onOffer: (toUserId: string, offer: RTCSessionDescriptionInit) => void;
  onAnswer: (toUserId: string, answer: RTCSessionDescriptionInit) => void;
  onIceCandidate: (toUserId: string, candidate: RTCIceCandidateInit) => void;
}

// Creates a PeerConnection for a specific remote user
// and sets up all its event handlers
const createPeerConnection = (
  remoteUserId: string,
  callbacks: WebRTCCallbacks,
): RTCPeerConnection => {
  // If connection already exists, don't recreate
  if (peerConnections.has(remoteUserId))
    return peerConnections.get(remoteUserId)!;

  const pc = new RTCPeerConnection(ICE_SERVERS);
  // When we discover a network path, send it to the remote user
  pc.onicecandidate = (event) => {
    if (event.candidate) {
      console.log("ICE candidate found:", event.candidate);
      callbacks.onIceCandidate(remoteUserId, event.candidate.toJSON());
    }
  };
  // When remote user's audio arrives, play it
  pc.ontrack = (event) => {
    let remoteAudio = document.getElementById(
      `audio-${remoteUserId}`,
    ) as HTMLAudioElement;
    console.log("Remote track received from:", remoteUserId);
    if (!remoteAudio) {
      remoteAudio = document.createElement("audio");
      remoteAudio.id = `audio-${remoteUserId}`;
      remoteAudio.autoplay = true;
      // Hidden but active
      remoteAudio.style.display = "none";
      document.body.appendChild(remoteAudio);
    }

    remoteAudio.srcObject = event.streams[0];
    // Force play to bypass some browser restrictions
    remoteAudio.play().catch((e) => console.error("Autoplay blocked:", e));
  };
  // Add our microphone tracks to this connection
  // so the remote user can hear us
  if (localStream) {
    localStream.getTracks().forEach((track) => {
      pc.addTrack(track, localStream!);
    });
  }

  // Store the connection
  peerConnections.set(remoteUserId, pc);
  pc.onconnectionstatechange = () => {
    console.log("Connection state:", pc.connectionState);
  };

  return pc;
};

// Called when user clicks "Join Voice"
export const joinVoice = async (
  existingUserIds: string[],
  callbacks: WebRTCCallbacks,
) => {
  try {
    // Request microphone access
    localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    console.log("Microphone acquired:", localStream);
  } catch (error) {
    console.error("Microphone access denied:", error);
    return;
  }

  // For each person already in the room
  // we initiate a connection TO them
  for (const userId of existingUserIds) {
    const pc = createPeerConnection(userId, callbacks);
    console.log("Creating offer for:", userId);
    // Create an offer to send to this person
    const offer = await pc.createOffer();

    // Set it as our local description
    // this starts ICE candidate gathering
    await pc.setLocalDescription(offer);
    console.log("Offer created and sent to:", userId);

    // Send the offer to that person via signaling
    callbacks.onOffer(userId, offer);
  }
};

// Called when we receive an offer from someone who just joined
export const handleOffer = async (
  fromUserId: string,
  offer: RTCSessionDescriptionInit,
  callbacks: WebRTCCallbacks,
) => {
  const pc = createPeerConnection(fromUserId, callbacks);
  console.log("handleOffer received from:", fromUserId);
  // Understand what they are offering
  await pc.setRemoteDescription(new RTCSessionDescription(offer));

  // Create our response
  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);

  // Send the answer back to them
  callbacks.onAnswer(fromUserId, answer);
};

// Called when we receive an answer to our offer
export const handleAnswer = async (
  fromUserId: string,
  answer: RTCSessionDescriptionInit,
) => {
  const pc = peerConnections.get(fromUserId);
  if (!pc) return;

  await pc.setRemoteDescription(new RTCSessionDescription(answer));
};

// Called when we receive an ICE candidate from a remote user
export const handleIceCandidate = async (
  fromUserId: string,
  candidate: RTCIceCandidateInit,
) => {
  const pc = peerConnections.get(fromUserId);
  if (!pc) return;

  try {
    await pc.addIceCandidate(new RTCIceCandidate(candidate));
  } catch (error) {
    console.error("Error adding ICE candidate:", error);
  }
};

// Called when user clicks "Leave Voice" or leaves the room
export const leaveVoice = () => {
  // Stop our microphone
  if (localStream) {
    localStream.getTracks().forEach((track) => track.stop());
    localStream = null;
  }

  // Close all peer connections
  peerConnections.forEach((pc, userId) => {
    pc.close();

    // Remove the audio element for this user
    const audioElem = document.getElementById(`audio-${userId}`);
    if (audioElem) audioElem.remove();
  });

  peerConnections.clear();
};
