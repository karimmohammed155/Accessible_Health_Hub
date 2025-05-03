import { notification } from "../../../DB/models/index.js";

export const get_notifications=async(req,res)=>{
  try {
    const Notifications = await notification.find({ receiver: req.user._id })
      .populate('sender', 'name')
      .populate('postId', 'title')
      .sort({ createdAt: -1 });

    res.status(200).json(Notifications);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
}

export const markAsRead = async (req, res) => {
  try {
    await notification.findByIdAndUpdate(req.params._id, { isRead: true });
    res.status(200).json({ message: 'Notification marked as read' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update notification' });
  }
};
