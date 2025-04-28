import mongoose from "mongoose";
const { model, Schema } = mongoose;

const notification_schema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["like", "comment", "rate", "save", "mention"],
      required: true,
    },
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "post",
      required: true,
    },
    is_read: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false }
);

export const notification =
  mongoose.models.notification || model("notification", notification_schema);
