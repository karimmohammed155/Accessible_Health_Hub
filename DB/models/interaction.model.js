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
      enum: ["like", "rating"],
      required: true,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },
  },
  { timestamps: true, versionKey: false }
);

export const interaction =
  mongoose.models.interaction || model("interaction", Interaction_schema);
