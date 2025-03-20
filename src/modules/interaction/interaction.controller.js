import { interaction, post } from "../../../DB/models/index.js";
import { Error_handler_class } from "../../utils/index.js";

// POST /api/interaction/{post_id}/like
export const like_post = async (req, res, next) => {
  const { post_id } = req.params;
  const user_id = req.user._id;

  if (!post_id || !user_id) {
    return next(
      new Error_handler_class(
        "invalid post id or user id",
        400,
        "like_post api"
      )
    );
  }
  const like_exists = await interaction.findOne({
    user_id: user_id,
    post_id: post_id,
    type: "like",
  });
  if (like_exists) {
    await interaction.findByIdAndDelete(like_exists._id);
    await post.findByIdAndUpdate(post_id, {
      $pull: { interactions: like_exists._id },
    });
    return res.json({ message: "Like Removed" });
  }
  const new_like = new interaction({
    user_id: user_id,
    post_id: post_id,
    type: "like",
  });
  await new_like.save();
  await post.findByIdAndUpdate(post_id, {
    $push: { interactions: new_like._id },
  });
  res.status(201).json({ message: "Post Liked", Data: new_like });
};
// POST /api/interaction/{postId}/rate
export const rate_post = async (req, res, next) => {
  const { post_id } = req.params;
  const user_id = req.user._id;
  const { rating } = req.body;

  if (!post_id || !user_id) {
    return next(
      new Error_handler_class(
        "invalid post id or user id",
        400,
        "like_post api"
      )
    );
  }

  if (rating < 1 || rating > 5) {
    return next(
      new Error_handler_class(
        "Rating must be between 1 and 5",
        400,
        "rate post api"
      )
    );
  }
  const rating_exists = await interaction.findOne({
    user_id: user_id,
    post_id: post_id,
    type: "rating",
  });
  if (rating_exists) {
    rating_exists.rating = rating;
    await rating_exists.save();
    return res.json({ message: "Rating Updated", interaction: rating_exists });
  }
  const new_rate = new interaction({
    user_id: user_id,
    post_id: post_id,
    type: "rating",
  });
  await new_rate.save();
  await post.findByIdAndUpdate(post_id, {
    $push: { interactions: new_rate._id },
  });
  res.status(201).json({ message: "Post Rated", Data: new_rate });
};
// GET /api/interaction/{postId}/likes_count
export const get_likes_count = async (req, res, next) => {
  const { post_id } = req.params;

  const post_exists = await post.findOne({ _id: post_id });
  if (!post_exists) {
    return res.status(404).json({ error: "Post not found" });
  }
  const likes_count = await interaction.countDocuments({
    post_id: post_id,
    type: "like",
  });
  res.status(201).json({ post: post_id, likes_count: likes_count });
};
// GET /api/interactions/{postId}/ratings_count
export const get_Ratings_count = async (req, res, next) => {
  const { post_id } = req.params;

  const post_exists = await post.findOne({ _id: post_id });
  if (!post_exists) {
    return res.status(404).json({ error: "Post not found" });
  }
  const ratings = await interaction.find({ post_id: post_id, type: "rating" });

  if (ratings.length === 0) {
    return res.json({ post_id: post_id, ratings_count: 0 });
  }
  res.status(200).json({
    post: post_id,
    ratings_count: ratings.length,
  });
};
