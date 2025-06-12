import mongoose from "../global-setup.js";
const { model, Schema } = mongoose;

const post_schema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    files: {
      urls: {
        type: [
          {
            secure_url: String,
            public_id: String,
          },
        ],
        default: null,
      },
      custom_id: String,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    interactions: [
      {
        type: Schema.Types.ObjectId,
        ref: "interaction",
      },
    ],
    comments: [
      {
        type: Schema.Types.ObjectId,
        ref: "comment",
      },
    ],
    sub_category: {
      type: Schema.Types.ObjectId,
      ref: "sub_category",
    },
    isFlagged: { type: Boolean, default: false },
    isLiked: { type: Boolean, default: false },
    isRated: { type: Boolean, default: false },
    isSaved: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false }
);
post_schema.index({ title: "text", content: "text" });
post_schema.index({ createdAt: -1 });
post_schema.index({ sub_category: 1 });
post_schema.index({ author: 1 });     
export const post = mongoose.models.post || model("post", post_schema);
