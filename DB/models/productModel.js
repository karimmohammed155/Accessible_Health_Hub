import { model, Schema, Types } from "mongoose";

const productSchema=new Schema({
    name:{
        type:String,required:true,min:2,max:20
    },
    description:{
        type:String,min:10,max:200
    },
    productImage:{
        id:{type:String,required:true},
        url:{type:String,required:true},
    },
    price:{
        type:Number,min:1,required:true
    },
    cloudFolder:{
        type:String,
        // unique:true,
        // required:false
    },
    admin: {
        type: Schema.Types.ObjectId,
        ref: "admin",
        required: false, // todo
      },
    link:{
        type:String,required:true
    }
},
{timestamps:true});


export const Product=model("Product",productSchema);