import mongoose from "mongoose";
const { model, Schema } = mongoose;

const Interaction_schema = new Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    post_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "post",
      required: true,
    },
    type: {
      type: String,
      enum: ["like", "save"],
      required: true,
    },
    isLiked: { type: Boolean, default: false },
    isSaved: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false }
);

Interaction_schema.index({ post_id: 1, type: 1 });

export const interaction =
  mongoose.models.interaction || model("interaction", Interaction_schema);
