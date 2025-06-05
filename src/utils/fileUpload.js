// src/middleware/upload.js
import multer, { diskStorage } from "multer";
import path from "path";
// middleware/cloudinaryUpload.js



export const fileUpload=()=>{
    const fileFilter=(req,res,cb)=>{
        if(![ "image/jpeg", "image/png", "image/jpg", "image/webp", "application/pdf" ].includes(file.mimetype))
            return cb(new Error("Invalid format"),false);
    
    return cb(null,true);
    };
    return multer({storage:diskStorage({})});
}

