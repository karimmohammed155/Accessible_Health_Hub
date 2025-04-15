import { Error_handler_class } from "../utils/index.js"

export const error_handle=(API)=>{
    return (req,res,next)=>{
        API(req,res,next).catch((err)=>{
            console.log("error in handle middleware",err)
            const insights={
                error:"unhandled error"
            }
            next(new Error_handler_class(
                "internal server error",
                500,
                "error in error_handle middleware",
                err.stack,
                insights
            ))
        })
    }
}

export const global_response=(err,req,res,next)=>{
    if(err){
    res.status(err["status_code"] || 500).json({
        message:"internal server error",
        error:err.message,
        stack:err.stack,
        errPosition:err.name,
        data:err.data
    })
    }
}