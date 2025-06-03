// src/middleware/upload.js
import multer, { diskStorage } from "multer";
import path from "path";

const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

export const fileAudioUpload = () => {
  const storage = diskStorage({
    destination: (req, file, cb) => {
      cb(null, "uploads/");
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
      cb(null, uniqueName);
    },
  });

  const fileFilter = (req, file, cb) => {
    const allowedMimeTypes = [
      "audio/mpeg", "audio/wav", "audio/mp3", "audio/x-m4a", "audio/mp4",
      "image/jpeg", "image/png", "image/jpg", "image/webp", "application/pdf" // include PDFs if needed for ID
    ];
  
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(new Error("Invalid file format"), false);
    }
  
    cb(null, true);
  };

  return multer({ 
    storage,
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 }

});
};

export const fileUpload=()=>{
    const fileFilter=(req,res,cb)=>{
        if(![ "image/jpeg", "image/png", "image/jpg", "image/webp", "application/pdf" ].includes(file.mimetype))
            return cb(new Error("Invalid format"),false);
    
    return cb(null,true);
    };
    return multer({storage:diskStorage({})});
}