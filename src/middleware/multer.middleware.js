import multer from "multer"
import fs from "fs"
import path from "path"
import {nanoid} from "nanoid"
import { Error_handler_class, extensions } from "../Utils/index.js"

export const multer_middleware=({file_path="general",allowed_extensions}={})=>{
    const storage=multer.diskStorage({
        destination:(req,file,cb)=>{
            const destination_path=path.resolve(`src/uploads/${file_path}`)
            if(!fs.existsSync(destination_path)){
                fs.mkdirSync(destination_path,{recursive:true})
            }
            cb(null,destination_path);
        },
        filename:(req,file,cb)=>{
            const unique_filename=nanoid(4) + "__" + file.originalname
            cb(null,unique_filename)
        }
    })

    const fileFilter=(req,file,cb)=>{        
        if(allowed_extensions.includes(file.mimetype)){
            return cb(null,true)
        }
        cb(
            new Error_handler_class(
                `Invalid file type, only ${allowed_extensions} images are allowed`,
                400,
                `Invalid file type, only ${allowed_extensions} images are allowed`
              ),
              false
            )
    }

    const file_upload=multer({fileFilter,storage,limits:{fields:3,files:2}})
    return file_upload
}

export const multer_host=({allowed_extensions = extensions.images}={})=>{
    const storage=multer.diskStorage({
    filename:(req,file,cb)=>{
        const unique_filename=nanoid(4) + "__" + file.originalname
        cb(null,unique_filename)
    }
    })
    const fileFilter = (req, file, cb) => {
        if (allowed_extensions.includes(file.mimetype)) {
          return cb(null, true);
        }
    
        cb(
          new Error_handler_class(
            `Invalid file type, only ${allowed_extensions} images are allowed`,
            400,
            `Invalid file type, only ${allowed_extensions} images are allowed`
          ),
          false
        )}
    const file_upload=multer({fileFilter,storage})
    return file_upload
}