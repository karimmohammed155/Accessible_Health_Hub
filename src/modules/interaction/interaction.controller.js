import { interaction, post } from "../../../DB/models/index.js";
import { Error_handler_class } from "../../utils/index.js";

// POST /api/interaction/{post_id}/like
export const like_post = async (req, res, next) => {
  const { post_id } = req.params;
  const user_id = req.user._id;
  // check if post and user ids are valid
  if (!post_id || !user_id) {
    return next(
      new Error_handler_class(
        "invalid post id or user id",
        400,
        "like_post api"
      )
    );
  }
  // check if post exists
  const post_exists = await post.findOne({ _id: post_id });
  if (!post_exists) {
    return res.status(404).json({ error: "Post not found" });
  }
  // check if like exists
  const like_exists = await interaction.findOne({
    user_id: user_id,
    post_id: post_id,
    type: "like",
  });
  // remove like from interaction and post
  if (like_exists) {
    await interaction.findByIdAndDelete(like_exists._id);
    await post.findByIdAndUpdate(post_id, {
      $pull: { interactions: like_exists._id },
    });
    return res.json({ message: "Like Removed" });
  }
  // add new like
  const new_like = new interaction({
    user_id: user_id,
    post_id: post_id,
    type: "like",
  });
  await new_like.save();
  // add like to post
  await post.findByIdAndUpdate(post_id, {
    $push: { interactions: new_like._id },
  });
  // response
  res.status(201).json({ message: "Post Liked", Data: new_like });
};
// POST /api/interaction/{postId}/rate
export const rate_post = async (req, res, next) => {
  const { post_id } = req.params;
  const user_id = req.user._id;
  const { rating } = req.body;
  // check if post and user ids are valid
  if (!post_id || !user_id) {
    return next(
      new Error_handler_class(
        "invalid post id or user id",
        400,
        "like_post api"
      )
    );
  }
  // check if post exists
  const post_exists = await post.findOne({ _id: post_id });
  if (!post_exists) {
    return res.status(404).json({ error: "Post not found" });
  }
  // check rating min and max values
  if (rating < 1 || rating > 5) {
    return next(
      new Error_handler_class(
        "Rating must be between 1 and 5",
        400,
        "rate post api"
      )
    );
  }
  // check if rating exists
  const rating_exists = await interaction.findOne({
    user_id: user_id,
    post_id: post_id,
    type: "rating",
  });
  // update rating with new one
  if (rating_exists) {
    rating_exists.rating = rating;
    await rating_exists.save();
    return res.json({ message: "Rating Updated", interaction: rating_exists });
  }
  // add new rating
  const new_rate = new interaction({
    user_id: user_id,
    post_id: post_id,
    type: "rating",
    rating: rating,
  });
  await new_rate.save();
  // add rate to post
  await post.findByIdAndUpdate(post_id, {
    $push: { interactions: new_rate._id },
  });
  // response
  res.status(201).json({ message: "Post Rated", Data: new_rate });
};
// POST /api/interaction/{postId}/save
export const save_post = async (req, res, next) => {
  const { post_id } = req.params;
  const user_id = req.user._id;
  // check if post and user ids are valid
  if (!post_id || !user_id) {
    return next(
      new Error_handler_class(
        "invalid post id or user id",
        400,
        "like_post api"
      )
    );
  }
  // check if post exists
  const post_exists = await post.findOne({ _id: post_id });
  if (!post_exists) {
    return res.status(404).json({ error: "Post not found" });
  }
  // check if save exists
  const save_exists = await interaction.findOne({
    post_id: post_id,
    user_id: user_id,
    type: "save",
  });
  // remove save from post and interaction
  if (save_exists) {
    await interaction.findByIdAndDelete(save_exists._id);
    await post.findByIdAndUpdate(post_id, {
      $pull: { interactions: save_exists._id },
    });
    return res.json({ message: "Post unsaved" });
  }
  // add new save
  const new_save = new interaction({
    user_id: user_id,
    post_id: post_id,
    type: "save",
  });
  await new_save.save();
  // add save to post
  await post.findByIdAndUpdate(post_id, {
    $push: { interactions: new_save._id },
  });
  // response
  res.status(201).json({ message: "Post saved", Data: new_save });
};
// GET /api/interaction/{postId}/likes_count
export const get_likes_count = async (req, res, next) => {
  const { post_id } = req.params;
  // check if post exists
  const post_exists = await post.findOne({ _id: post_id });
  if (!post_exists) {
    return res.status(404).json({ error: "Post not found" });
  }
  // get likes count for specific post
  const likes_count = await interaction.countDocuments({
    post_id: post_id,
    type: "like",
  });
  // response
  res.status(201).json({ post: post_id, likes_count: likes_count });
};
// GET /api/interactions/{postId}/ratings_count
export const get_Ratings_count = async (req, res, next) => {
  const { post_id } = req.params;
  // check if post exists
  const post_exists = await post.findOne({ _id: post_id });
  if (!post_exists) {
    return res.status(404).json({ error: "Post not found" });
  }
  // get ratings count for specific post
  const ratings = await interaction.find({ post_id: post_id, type: "rating" });
  // if there are not ratings exists return count 0
  if (ratings.length === 0) {
    return res.json({ post_id: post_id, ratings_count: 0 });
  }
  // response
  res.status(200).json({
    post: post_id,
    ratings_count: ratings.length,
  });
};
// GET /api/interactions/saved_posts
export const get_saved_post = async (req, res, next) => {
  // retrieve saved posts for authenticated user
  const saved_posts = await interaction
    .find({
      user_id: req.user._id,
      type: "save",
    })
    .populate("post_id");
  // Check if saved posts exist
  if (!saved_posts || saved_posts.length == 0) {
    return res
      .status(404)
      .json({ message: "No saved posts found for this user." });
  }
  // response
  res.status(200).json(saved_posts.map((i) => i.post_id));
};
