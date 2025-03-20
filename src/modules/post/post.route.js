import router from "express";
import * as post_controller from "./post.controller.js";
import {
  error_handle,
  isAuthenticated,
  multer_host,
} from "../../middleware/index.js";
import { extensions } from "../../utils/index.js";

const post_router = router();

post_router.post(
  "/add",
  isAuthenticated,
  multer_host(extensions.images).single("image"),
  error_handle(post_controller.add_post)
);
post_router.get("/list", error_handle(post_controller.get_all_posts));
post_router.delete(
  "/:post_id/delete",
  isAuthenticated,
  error_handle(post_controller.delete_post)
);

export { post_router };
