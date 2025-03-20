import mongoose, { Types } from "mongoose";
const { model, Schema } = mongoose;

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      min: 2,
      max: 25,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    profileImage: {
      id: { type: String, required: true },
      url: { type: String, required: true },
    },
    role: {
      //Need to ask about it
      type: String,
      enum: ["doctor", "user"],
      default: "user",
    },
    is_email_verified: {
      type: Boolean,
      default: false,
    },
    admin: {
      //Need to ask about it
      type: Types.ObjectId,
      ref: "Admin",
    },
    cloudFolder: { type: String, unique: true, required: true },
    forgetCode: { type: String, length: 5 },
  },
  { timestamps: true, versionKey: false }
);

export const User = mongoose.models.User || model("User", userSchema);
