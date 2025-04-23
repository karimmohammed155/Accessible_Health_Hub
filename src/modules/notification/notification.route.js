import express from "express";
import * as notification_controller from "../notification/notification.controller.js";
import { isAuthenticated } from "../../middleware/index.js";

const notification_router = express.Router();

notification_router.post("/", isAuthenticated, notification_controller.create_notification);
notification_router.get("/history", isAuthenticated, notification_controller.get_notification_history);


export { notification_router };
