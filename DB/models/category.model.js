import mongoose from "mongoose";
const { model, Schema } = mongoose;

const category_schema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
  },
  { timestamps: true, versionKey: false }
);

export const category =
  mongoose.models.category || model("category", category_schema);
