import { User, post, notification } from "../../../DB/models/index.js";

export const create_notification = async (req, res, next) => {
  try {
    const { sender, type, post_id, userId } = req.body;

    const newNotification = new notification({
      sender,
      userId,
      type,
      post_id,
    });

    await newNotification.save();

    res.status(201).json({
      success: true,
      message: "Notification created successfully",
      data: newNotification,
    });
  } catch (err) {
    next(err);
  }
};

export const get_user_notifications = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const notifications = await notification
      .find({ recipient: userId, is_read: false })
      .populate("sender", "username profile_picture")
      .populate("post_id", "title")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Unread notifications retrieved successfully",
      data: notifications,
    });
  } catch (err) {
    next(err);
  }
};

export const get_notification_history = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 20 } = req.query;

    const notifications = await notification
      .find({ recipient: userId })
      .populate("sender", "username profile_picture")
      .populate("post_id", "title")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      message: "Notification history retrieved successfully",
      data: notifications,
    });
  } catch (err) {
    next(err);
  }
};

export const mark_as_read = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const updatedNotification = await notification
      .findOneAndUpdate(
        { _id: id, recipient: userId },
        { is_read: true },
        { new: true }
      )
      .populate("sender", "username profile_picture")
      .populate("post_id", "title");

    if (!updatedNotification) {
      return next(new Error("Notification not found", { cause: 404 }));
    }

    res.status(200).json({
      success: true,
      message: "Notification marked as read",
      data: updatedNotification,
    });
  } catch (err) {
    next(err);
  }
};
