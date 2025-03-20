import { model, Schema, Types } from "mongoose";

const tokenSchema=new Schema({
    token:{type:String,required:true},
    user:{type:Types.ObjectId,ref:"User"},
    role:{type:String,default:"user"},//Need to ask about
    isValid:{type:Boolean,default:true},
    expiredAt:{type:String},
},{timestamps:true});

export const Token=model("Token",tokenSchema);