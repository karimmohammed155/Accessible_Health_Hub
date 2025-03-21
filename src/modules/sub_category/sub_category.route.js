import router from "express";
import * as sub_category_controller from "./sub_category.controller.js";
import { error_handle, isAuthenticated } from "../../middleware/index.js";
const sub_category_router = router();

sub_category_router.post(
  "/add",
  isAuthenticated,
  error_handle(sub_category_controller.add_sub_category)
);
sub_category_router.get(
  "/get",
  error_handle(sub_category_controller.find_sub_category)
);
sub_category_router.put(
  "/update/:_id",
  isAuthenticated,
  error_handle(sub_category_controller.update_sub_category)
);
sub_category_router.delete(
  "/delete/:_id",
  isAuthenticated,
  error_handle(sub_category_controller.delete_sub_category)
);
export { sub_category_router };
