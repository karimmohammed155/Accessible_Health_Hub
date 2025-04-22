import { model, Schema } from "mongoose";

const adminSchema=new Schema({
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
      forgetCode: { type: String, length: 5 },

},{timestamps:true});

export const Admin=model("Admin",adminSchema);