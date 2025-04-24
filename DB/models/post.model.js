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
    admin: {
      type: Schema.Types.ObjectId,
      ref: "admin",
      required: false, // todo
    },
    sub_category: {
      type: Schema.Types.ObjectId,
      ref: "sub_category",
      required: false, // todo
    },
    isFlagged: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false }
);
post_schema.index({ title: "text", content: "text" }); 

export const post = mongoose.models.post || model("post", post_schema);
