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
      is_email_verified: {
        type: Boolean,
        default: false,
      },
      forgetCode: { type: String, length: 5 },

},{timestamps:true});

export const Admin=model("Admin",adminSchema);