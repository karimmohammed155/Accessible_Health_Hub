// socket/index.js
import { notification } from "../../DB/models/index.js";

export const socketHandler = (io, socket) => {
  // Join a room based on user ID
  socket.on("joinRoom", (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined room`);
  });

  // Broadcast a new notification to the user
  socket.on("newNotification", async (notificationData) => {
    try {
      const { userId, type, postId, senderId } = notificationData;

      // Save the notification to the database
      const not = new notification({
        userId,
        type,
        postId,
        senderId,
        read: false,
      });

      await not.save();

      // Emit the notification to the user's room
      io.to(userId).emit("notification", not);
    } catch (error) {
      console.error("Error broadcasting notification:", error);
    }
  });

  // Disconnect event
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
};
