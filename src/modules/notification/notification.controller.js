import { notification } from "../../../DB/models/index.js";

export const createNotification = async ({
  recipientId,
  senderId,
  postId,
  type,
  socket,
}) => {
  try {
    // Create and save notification
    const not = new notification({
      recipient: recipientId,
      sender: senderId,
      post: postId,
      type,
    });

    await not.save();

    // Emit notification to recipient's socket room
    if (socket && recipientId) {
      socket.to(recipientId.toString()).emit("new_notification", not);
      console.log("📨 Real-time notification sent to", recipientId.toString());
    }

    return not;
  } catch (err) {
    console.error("❌ Failed to create or emit notification:", err);
    throw err;
  }
};
