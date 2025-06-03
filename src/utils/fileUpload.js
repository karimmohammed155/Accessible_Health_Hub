// src/middleware/upload.js
import multer, { diskStorage } from "multer";

import path from "path";
import fs from 'fs';




import { CloudinaryStorage } from 'multer-storage-cloudinary';
import {cloudinary} from './cloudinary.js';

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'audio_uploads',
    resource_type: 'auto', // Allows audio files
    format: async (req, file) => file.originalname.split('.').pop(),
    public_id: (req, file) => `${Date.now()}-${Math.round(Math.random() * 1e9)}`,
  },
});



export const fileUpload=()=>{
    const fileFilter=(req,res,cb)=>{
        if(![ "image/jpeg", "image/png", "image/jpg", "image/webp", "application/pdf" ].includes(file.mimetype))
            return cb(new Error("Invalid format"),false);
    
    return cb(null,true);
    };
    return multer({storage:diskStorage({})});
}


const parser = multer({ storage });

export default parser;

