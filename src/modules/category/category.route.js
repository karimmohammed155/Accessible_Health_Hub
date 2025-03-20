import router from "express";
import * as category_controller from "./category.controller.js";
import { error_handle, isAuthenticated } from "../../middleware/index.js";
const category_router = router();

category_router.post(
  "/add",
  isAuthenticated,
  error_handle(category_controller.add_category)
);
category_router.get(
  "/get",
  error_handle(category_controller.find_category)
);
category_router.put(
  "/update/:_id",
  isAuthenticated,
  error_handle(category_controller.update_category)
);
category_router.delete(
  "/delete/:_id",
  isAuthenticated,
  error_handle(category_controller.delete_category)
);
export { category_router };
