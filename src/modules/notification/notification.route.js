import router from "express";
import * as notification_controller from "../notification/notification.controller.js";
import { isAuthenticated } from "../../middleware/index.js";

const notification_router = router();

notification_router.get(
  "/",
  isAuthenticated,
  notification_controller.get_notifications
);
notification_router.patch(
  "/:_id/read",
  isAuthenticated,
  notification_controller.markAsRead
);

export { notification_router };
