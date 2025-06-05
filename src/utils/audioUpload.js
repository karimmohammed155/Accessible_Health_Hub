// src/middleware/upload.js
import multer from "multer";
// middleware/cloudinaryUpload.js
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



const parser = multer({ storage });

export  default parser;
