import mongoose from "mongoose";
const { model, Schema } = mongoose;

const notification_schema = new Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: { type: String, enum: ["like", "comment", "save"], required: true },
    postId: { type: mongoose.Schema.Types.ObjectId, ref: "post" },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false }
);

export const notification = model("notification", notification_schema);
