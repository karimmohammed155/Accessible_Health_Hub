import mongoose from "mongoose";
const { model, Schema } = mongoose;

const notification_schema = new Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    post: { type: mongoose.Schema.Types.ObjectId, ref: "post" },
    type: {
      type: String,
      enum: ["like", "comment", "rate"],
      required: true,
    },
    is_read: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false }
);

export const notification =
  mongoose.models.notification || model("notification", notification_schema);
