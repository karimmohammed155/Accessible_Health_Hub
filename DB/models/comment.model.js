import mongoose from "mongoose";
const { model, Schema } = mongoose;

const comment_schema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    post_id: {
      type: Schema.Types.ObjectId,
      ref: "post",
      required: true,
    },
    parent_comment: {
      type: Schema.Types.ObjectId,
      ref: "comment",
      default: null,
    },
    replies: [{
      type: Schema.Types.ObjectId,
      ref: "comment"
     }],
  },
  { timestamps: true, versionKey: false }
);

comment_schema.index({ parent_comment: 1 });
comment_schema.index({ post_id: 1 });
comment_schema.index({ author: 1 }); 

export const comment =
  mongoose.models.comment || model("comment", comment_schema);
