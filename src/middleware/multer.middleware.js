import multer from "multer";
import { nanoid } from "nanoid";
import { Error_handler_class, extensions } from "../utils/index.js";

export const multer_host = ({
  allowed_extensions = extensions.images,
} = {}) => {
  const storage = multer.diskStorage({
    filename: (req, file, cb) => {
      const unique_filename = nanoid(4) + "__" + file.originalname;
      cb(null, unique_filename);
    },
  });
  const fileFilter = (req, file, cb) => {
    if (allowed_extensions.includes(file.mimetype)) {
      return cb(null, true);
    }

    cb(
      new Error_handler_class(
        `Invalid file type, only ${allowed_extensions} are allowed`,
        400,
        `Invalid file type, only ${allowed_extensions} are allowed`
      ),
      false
    );
  };
  const file_upload = multer({
    fileFilter,
    storage: storage,
    limits: { fileSize: 200 * 1024 * 1024 },
  });
  return file_upload;
};
