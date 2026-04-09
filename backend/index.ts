// Entry point - boots the app
import express from "express";
import { createServer } from "http";
const app = express();
const httpServer = createServer(app);
import { Server } from "socket.io";
import { initSocket } from "./socket/index.ts";
import cors from "cors";
import roomRoutes from "./routes/room.routes.ts";
const io = new Server(httpServer, {
  cors: {
    origin: [
      "http://localhost:5173",
      "https://net-and-chill.netlify.app",
      "https://fattenable-hadlee-unpossessable.ngrok-free.dev",
    ],
    methods: ["GET", "POST"],
  },
});

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://net-and-chill.netlify.app",
      "https://fattenable-hadlee-unpossessable.ngrok-free.dev",
    ],
    methods: ["GET", "POST"],
  }),
);
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Net&Chill backend is running");
});

initSocket(io);
app.use("/api/rooms", roomRoutes);

httpServer.listen(3000, () => {
  console.log("Server is running on port 3000");
});
