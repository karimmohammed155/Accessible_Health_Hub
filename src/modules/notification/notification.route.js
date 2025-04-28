import express from "express";
import * as notification_controller from "../notification/notification.controller.js";
import { isAuthenticated } from "../../middleware/index.js";

const notification_router = express.Router();

notification_router.post("/create", isAuthenticated, notification_controller.create_notification);
notification_router.get("/history", isAuthenticated, notification_controller.get_user_notifications);


export { notification_router };
