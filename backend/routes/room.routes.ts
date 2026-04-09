import { Router } from "express";
import { roomService } from "../services/room.service.ts";
const router = Router();
import type { Request, Response } from "express";


router.post("/create", (req: Request, res: Response) => {
  const { videoUrl } = req.body;
  if (!videoUrl) {
    return res.status(400).json({ error: "videoUrl is required" });
  }
  const newRoom = roomService.createRoom(videoUrl);
//  add the creator as the first user in the room (so that the room doesn't get deleted immediately by the disconnect handler when they create it)


  res
    .status(201)
    .json({
      status: "success",
      data: {
        roomId: newRoom.id,
        videoUrl: newRoom.videoUrl,
        currentTime: newRoom.currentTime,
        isPlaying: newRoom.isPlaying,
      },
    });
});

router.get("/:roomId", (req: Request, res: Response) => {
    const { roomId } = req.params as { roomId: string };
    const room = roomService.getRoom(roomId);
    if (!room) {
        return res.status(404).json({ error: "Room not found" });
    }

    res.status(200).json({
        status: "success",
        data: {
            roomId: room.id,
            videoUrl: room.videoUrl,
            currentTime: room.currentTime,
            isPlaying: room.isPlaying,
            users: room.users
        }
    })

});

export default router;
