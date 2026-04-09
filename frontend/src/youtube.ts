let player: YT.Player | null = null;
let isSyncing = false;




interface PlayerCallbacks {
  onPlay: (currentTime: number) => void;
  onPause: (currentTime: number) => void;
  onSeek: (currentTime: number) => void;
}

export const extractVideoId = (url: string): string | null => {
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname.includes("youtube.com")) {
      const v = urlObj.searchParams.get("v");
      if (v) return v;
      const pathParts = urlObj.pathname.split("/");
      if (pathParts.includes("embed") || pathParts.includes("v")) {
        return pathParts[pathParts.length - 1];
      }
    }
    if (urlObj.hostname.includes("youtu.be")) {
      const id = urlObj.pathname.slice(1);
      return id.length >= 11 ? id.substring(0, 11) : id;
    }
    return null;
  } catch {
    return null;
  }
};

const loadAPI = () => {
    return new Promise<void>((resolve) => {
        if ((window as any).YT && (window as any).YT.Player) return resolve();
        (window as any).onYouTubeIframeAPIReady = () => resolve();
    });
};

export const    initializePlayer = async (
  roomState: any,
  videoPlayerId: string,
  callbacks: PlayerCallbacks,
) => {
  // 2.
  //  Kill the "Ghost" player immediately
  if (player) {
      console.log("Destroying old player to prevent postMessage loops");
      try { player.destroy(); } catch(e) {}
      player = null;
  }

  const videoId = extractVideoId(roomState.videoUrl);
  if (!videoId) return;

  // Wait for API properly
  await loadAPI();

  // Create the player
  player = new YT.Player(videoPlayerId, {
    height: "100%",
    width: "100%",
    videoId,
    playerVars: {
      autoplay: 0,
      controls: 1,
      rel: 0,
      modestbranding: 1,
      enablejsapi: 1, // MUST be here for sync to work
      origin: window.location.origin,
    },
    events: {
      onReady: () => {
        console.log("Sync Player Ready");
        player!.seekTo(roomState.currentTime ?? 0, true);
        if (roomState.isPlaying) player!.playVideo();
      },
      onStateChange: (event) => handleStateChange(event.data, callbacks),
    },
  });
};

const handleStateChange = (state: number, callbacks: PlayerCallbacks) => {
  // If this change came from a sync event, ignore it
  // do not send it back to the server
  if (isSyncing) return;

  const currentTime = player!.getCurrentTime();

  // State 1 = playing
  if (state === YT.PlayerState.PLAYING) {
    callbacks.onPlay(currentTime);
  }

  // State 2 = paused
  if (state === YT.PlayerState.PAUSED) {
    callbacks.onPause(currentTime);
  }
};

// Called when server says someone else played the video
export const syncPlay = (currentTime: number) => {
  if (!player) return;

  // Set flag BEFORE touching the player
  isSyncing = true;

  player.seekTo(currentTime, true);
  player.playVideo();

  // Clear flag AFTER a small delay
  // The delay ensures onStateChange has time to fire
  // before we clear the flag
  setTimeout(() => {
    isSyncing = false;
  }, 5000);
};

// Called when server says someone else paused the video
export const syncPause = (currentTime: number) => {
  if (!player) return;

  isSyncing = true;

  player.seekTo(currentTime, true);
  player.pauseVideo();

  setTimeout(() => {
    isSyncing = false;
  }, 500);
};

// Called when server says someone else seeked the video
export const syncSeek = (currentTime: number) => {
  if (!player) return;

  isSyncing = true;

  player.seekTo(currentTime, true);

  setTimeout(() => {
    isSyncing = false;
  }, 500);
};


// let player: YT.Player | null = null;

// export const extractVideoId = (url: string): string | null => {
//   try {
//     const urlObj = new URL(url);
//     if (urlObj.hostname.includes("youtube.com")) {
//       const v = urlObj.searchParams.get("v");
//       if (v) return v;
//       const pathParts = urlObj.pathname.split("/");
//       if (pathParts.includes("embed") || pathParts.includes("v")) {
//         return pathParts[pathParts.length - 1];
//       }
//     }
//     if (urlObj.hostname.includes("youtu.be")) {
//       const id = urlObj.pathname.slice(1);
//       return id.length >= 11 ? id.substring(0, 11) : id;
//     }
//     return null;
//   } catch {
//     return null;
//   }
// };

// // Inject the YouTube IFrame API script into the page
// const loadYouTubeAPI = (): Promise<void> => {
//   return new Promise((resolve) => {
//     // If API is already loaded, resolve immediately
//     if ((window as any).YT && (window as any).YT.Player) {
//       console.log("[YT] API already loaded");
//       resolve();
//       return;
//     }

//     // If the script tag is already injected but not done loading, wait for it
//     if (document.getElementById("youtube-iframe-api")) {
//       console.log("[YT] Script tag exists, waiting for API ready...");
//       (window as any).onYouTubeIframeAPIReady = () => {
//         console.log("[YT] API ready (waited)");
//         resolve();
//       };
//       return;
//     }

//     // Fresh inject
//     console.log("[YT] Injecting API script...");
//     (window as any).onYouTubeIframeAPIReady = () => {
//       console.log("[YT] API ready (fresh inject)");
//       resolve();
//     };

//     const tag = document.createElement("script");
//     tag.id = "youtube-iframe-api";
//     tag.src = "https://www.youtube.com/iframe_api";
//     document.head.appendChild(tag);
//   });
// };

// /**
//  * Standalone init — call this with just a video URL and a container element ID.
//  * No socket, no roomState, no callbacks needed.
//  *
//  * Usage:
//  *   import { standaloneInit } from "./youtube";
//  *   standaloneInit("https://www.youtube.com/watch?v=U1B2sprdkGA", "video-player");
//  */
// export const standaloneInit = async (
//   videoUrl: string,
//   containerId: string
// ): Promise<void> => {
//   console.log("[YT] standaloneInit called");
//   console.log("[YT] videoUrl:", videoUrl);
//   console.log("[YT] containerId:", containerId);

//   // 1. Check the container element exists
//   const container = document.getElementById(containerId);
//   if (!container) {
//     console.error(`[YT] ERROR: No element found with id="${containerId}"`);
//     return;
//   }
//   console.log("[YT] Container element found:", container);

//   // 2. Extract video ID
//   const videoId = extractVideoId(videoUrl);
//   if (!videoId) {
//     console.error("[YT] ERROR: Could not extract video ID from URL:", videoUrl);
//     return;
//   }
//   console.log("[YT] Video ID extracted:", videoId);

//   // 3. Destroy existing player if any
//   if (player) {
//     console.log("[YT] Destroying existing player before creating new one");
//     player.destroy();
//     player = null;
//   }

//   // 4. Load the API (waits for onYouTubeIframeAPIReady)
//   await loadYouTubeAPI();

//   // 5. Create the player
//   console.log("[YT] Creating YT.Player...");
//   player = new YT.Player(containerId, {
//     height: "100%",
//     width: "100%",
//     videoId,
//     playerVars: {
//       autoplay: 0,
//       controls: 1,
//       rel: 0,
//       modestbranding: 1,
//     },
//     events: {
//       onReady: (event) => {
//         console.log("[YT] onReady fired — player is live!");
//         // Optionally seek to 0 and confirm it's working
//         event.target.seekTo(0, true);
//       },
//       onStateChange: (event) => {
//         const stateNames: Record<number, string> = {
//           [-1]: "UNSTARTED",
//           [0]: "ENDED",
//           [1]: "PLAYING",
//           [2]: "PAUSED",
//           [3]: "BUFFERING",
//           [5]: "VIDEO_CUED",
//         };
//         console.log(
//           "[YT] onStateChange:",
//           stateNames[event.data] ?? event.data
//         );
//       },
//       onError: (event) => {
//         console.error("[YT] onError:", event.data);
//         // YouTube error codes:
//         // 2  = invalid video ID
//         // 5  = HTML5 player error
//         // 100 = video not found / private
//         // 101/150 = embedding not allowed by video owner
//       },
//     },
//   });

//   console.log("[YT] YT.Player instance created:", player);
// };

// // Expose play/pause/seek controls for manual testing in the browser console
// export const play = () => {
//   if (!player) return console.warn("[YT] No player");
//   player.playVideo();
// };

// export const pause = () => {
//   if (!player) return console.warn("[YT] No player");
//   player.pauseVideo();
// };

// export const seekTo = (seconds: number) => {
//   if (!player) return console.warn("[YT] No player");
//   player.seekTo(seconds, true);
// };

// export const getPlayer = () => player;