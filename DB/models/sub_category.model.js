import mongoose from "mongoose";
const { model, Schema } = mongoose;

const sub_category_schema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: "category",
      required: true,
    },
  },
  { timestamps: true, versionKey: false }
);

export const sub_category =
  mongoose.models.sub_category || model("sub_category", sub_category_schema);
