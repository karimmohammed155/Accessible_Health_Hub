import router from "express";
import * as comment_controller from "./comment.controller.js";
import { error_handle, isAuthenticated } from "../../middleware/index.js";

const comment_router = router();

comment_router.post(
  "/:post_id/add",
  isAuthenticated,
  error_handle(comment_controller.add_comment)
);
comment_router.get(
  "/:post_id/get",
  error_handle(comment_controller.get_comments)
);
comment_router.get(
  "/:post_id/get_count",
  error_handle(comment_controller.get_comments_count)
);
comment_router.delete(
  "/:_id/delete",
  isAuthenticated,
  error_handle(comment_controller.delete_comment)
);

export { comment_router };
