import router from "express";
import * as interaction_controller from "./interaction.controller.js";
import { error_handle, isAuthenticated } from "../../middleware/index.js";

const interaction_router = router();

interaction_router.post(
  "/:post_id/like",
  isAuthenticated,
  error_handle(interaction_controller.like_post)
);
interaction_router.post(
  "/:post_id/rate",
  isAuthenticated,
  error_handle(interaction_controller.rate_post)
);
interaction_router.get(
  "/:post_id/likes_count",
  error_handle(interaction_controller.get_likes_count)
);
interaction_router.get(
  "/:post_id/ratings_count",
  error_handle(interaction_controller.get_Ratings_count)
);


export { interaction_router };
