# Backend Scope of Work — Step by Step Checklist

## The One Rule Before We Start

> Build in this exact order. Each step is the foundation for the next. Skipping ahead is why projects break and become confusing.

---

## Phase 1: Get Your Project Breathing
### Goal: A server that turns on

```
□ Step 1.1 — Create your project folder
□ Step 1.2 — Initialize Node.js in it
□ Step 1.3 — Install your dependencies
□ Step 1.4 — Set up TypeScript
□ Step 1.5 — Create the entry point file (index.ts)
□ Step 1.6 — Confirm the server turns on
```

**Why this phase first?**
You can't build rooms, sync video, or handle sockets on a server that doesn't exist yet. This phase is purely "get the lights on."

**How you know it's done:**
You run one command and see "Server running on port 3000" in your terminal. Nothing else. Just that.

---

## Phase 2: Define Your Data Shapes
### Goal: Decide what a "room" and a "user" look like before touching them

```
□ Step 2.1 — Create your types file
□ Step 2.2 — Define what a User looks like
             (what information does a user have?)
□ Step 2.3 — Define what a Room looks like
             (what information does a room hold?)
□ Step 2.4 — Think through every field and ask "do I actually need this?"
```

**Why this phase second?**
Before you can store a room or update a room, you need to agree with yourself on what a room IS. If you skip this, every other file will have different assumptions about what a room looks like and your code will constantly fight itself.

**How you know it's done:**
You can describe out loud exactly what fields a room has and why each one exists. No code needed to verify this — it's a thinking step first.

**The questions to answer here:**
- What makes a room unique? → its ID
- What does the room need to remember? → the video URL, current time, play state
- What does a user need? → their socket ID, their username
- Does a room need to know its users? → yes, to broadcast to them and greet late joiners

---

## Phase 3: Build the Store
### Goal: Give your server a memory

```
□ Step 3.1 — Create the store file
□ Step 3.2 — Create the rooms Map using your types from Phase 2
□ Step 3.3 — Export it so other files can use it
```

**Why this phase third?**
The service layer (Phase 4) needs somewhere to read and write data. The store must exist before the service.

**How you know it's done:**
Your store file exists, uses the types you defined, and exports the rooms Map. Nothing else lives in this file. It holds data, nothing more.

**Important mindset:**
The store is dumb on purpose. It doesn't make decisions. It just holds information. Decision-making belongs in the service.

---

## Phase 4: Build the Service
### Goal: Give your server a brain

```
□ Step 4.1 — Create the room service file
□ Step 4.2 — Write the "create a room" function
             Think through: what needs to happen when a room is born?
□ Step 4.3 — Write the "get a room" function
             Think through: what do you return if the room doesn't exist?
□ Step 4.4 — Write the "add a user to a room" function
             Think through: what if the room doesn't exist when they try to join?
□ Step 4.5 — Write the "remove a user from a room" function
             Think through: what happens when the last user leaves?
□ Step 4.6 — Write the "update video state" function
             Think through: what three things change when someone presses play?
```

**Why this phase fourth?**
The service reads from and writes to the store. Store must exist first. The service also gets called by both your HTTP routes AND your socket handlers — so it must exist before either of those.

**How you know it's done:**
Every action a user can take in your app has a corresponding function here. You can trace every user action to a service function.

**The mental checklist for each function:**
- What information does this function need to do its job?
- What can go wrong? (room not found, user not found)
- What does it return?
- Does it need to clean up after itself?

---

## Phase 5: Build the HTTP Route
### Goal: Give the outside world one door into your server

```
□ Step 5.1 — Create the routes file
□ Step 5.2 — Create the "POST create room" endpoint
             Think through: what does the frontend send? what do you send back?
□ Step 5.3 — Create the "GET room info" endpoint
             Think through: what does a joining user need to know before connecting?
□ Step 5.4 — Connect your routes to index.ts
□ Step 5.5 — Test both endpoints manually with a tool like Postman or Thunder Client
```

**Why this phase fifth?**
Routes call the service. Service must exist first. Also — you only have two HTTP endpoints in this entire app. Room creation and room lookup. Everything else is handled by sockets. Understanding this early prevents over-engineering.

**How you know it's done:**
You can open Postman, send a POST request with a YouTube URL, and get back a room ID. You can then send a GET request with that room ID and get back the room's current state.

**Why only two HTTP endpoints?**
- Creating a room is a one-time action → HTTP is fine
- Joining, playing, pausing, chatting are ongoing → needs sockets
- HTTP is like knocking on a door. Sockets are like being inside the room already.

---

## Phase 6: Build the Socket Handlers
### Goal: Make real-time events actually do something

```
□ Step 6.1 — Create the socket index file
             This is what starts listening for connections
□ Step 6.2 — Build the Room Handler
   □ 6.2a — Handle "user wants to join a room"
             Think through: what does the server do when someone joins?
             - Subscribe their socket to the room
             - Add them to the store
             - Send them the current video state
             - Tell everyone else they arrived
   □ 6.2b — Handle "user is disconnecting"
             Think through: what must the server clean up?
             - Remove them from the store
             - Tell the room they left
             - Delete the room if it's now empty
□ Step 6.3 — Build the Video Handler
   □ 6.3a — Handle "video:play"
             Think through: what must happen on the server?
             - Update the store
             - Broadcast to everyone else WITH the timestamp
   □ 6.3b — Handle "video:pause"
             Think through: same as play but isPlaying becomes false
   □ 6.3c — Handle "video:seek"
             Think through: playing state doesn't change, only time does
□ Step 6.4 — Build the Chat Handler
   □ 6.4a — Handle "chat:message"
             Think through: who should receive chat messages?
             (everyone including sender, unlike video events)
□ Step 6.5 — Connect all handlers to the socket index file
□ Step 6.6 — Connect the socket index file to server index.ts
```

**Why this phase sixth?**
Handlers call the service. Service must exist. Also, you need a running server (Phase 1) before sockets mean anything.

**How you know it's done:**
You can open two browser tabs, connect both to your server, join the same room from both, and when one emits a video event the other receives it. Test this with a simple socket testing tool before touching the frontend.

---

## Phase 7: Verify the Whole Backend Works Together
### Goal: Confirm all phases connect correctly before building the frontend

```
□ Step 7.1 — Test room creation via HTTP (Postman)
□ Step 7.2 — Test room lookup via HTTP (Postman)
□ Step 7.3 — Test socket connection (socket.io client tester or simple HTML file)
□ Step 7.4 — Test joining a room via socket
             Confirm you receive the current room state back
□ Step 7.5 — Test video sync between two connections
             Open two connections to the same room
             Send video:play from one
             Confirm the other receives it
□ Step 7.6 — Test disconnection cleanup
             Disconnect one socket
             Confirm the room updates correctly
□ Step 7.7 — Test empty room cleanup
             Disconnect all sockets from a room
             Confirm the room is deleted from the store
```

**Why this phase before frontend?**
If your backend is broken and you start building the frontend at the same time, you'll never know which side has the bug. Verify the backend works in isolation first. This saves you hours of confusion.

**How you know it's done:**
Every test above passes. You can trace a YouTube URL from creation all the way through to multiple connected users receiving sync events.

---

## Project phases

```
Phase 1: Project Setup
   └── Goal: Server turns on

Phase 2: Define Types
   └── Goal: Know what a room and user look like

Phase 3: Build the Store
   └── Goal: Server has memory

Phase 4: Build the Service
   └── Goal: Server can make decisions

Phase 5: Build HTTP Routes
   └── Goal: Rooms can be created and looked up

Phase 6: Build Socket Handlers
   └── Goal: Real-time events actually work

Phase 7: Verify Everything
   └── Goal: Backend is solid before frontend begins
```

---

https://trackr-hub-app.lovable.app/