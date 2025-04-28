import { comment, post } from "../../../DB/models/index.js";

// POST /api/comment/{post_id}
export const add_comment = async (req, res, next) => {
  const { post_id } = req.params;
  const { text, parent_comment_id } = req.body;
  // check if post exist
  const post_exists = await post.findOne({ _id: post_id });
  if (!post_exists) {
    return res.status(404).json({ error: "Post not found" });
  }
  // If it's a reply, check if the parent comment exists and belongs to the same post
  let parent_comment = null;
  if (parent_comment_id) {
    parent_comment = await comment.findOne({
      _id: parent_comment_id,
      post_id: post_id,
    });
    if (!parent_comment) {
      return res
        .status(404)
        .json({ error: "Parent comment not found in this post" });
    }
  }
  // Add new comment
  const new_comment = new comment({
    text: text,
    author: req.user._id,
    post_id: post_id,
    parent_comment: parent_comment_id || null,
  });
  await new_comment.save();
  // check if it is a reply or new comment
  if (parent_comment_id) {
    // Add the reply to the parent comment's replies array
    await comment.findByIdAndUpdate(parent_comment_id, {
      $push: { replies: new_comment._id },
    });
  } else {
    // If it's a top-level comment, add it to the post
    await post.findByIdAndUpdate(
      { _id: post_id },
      { $push: { comments: new_comment._id } }
    );
  }
  // response
  res.status(201).json({ comment: new_comment });
};
// GET /api/comment/{post_id}/get
export const get_comments = async (req, res, next) => {
  const { post_id } = req.params;
  // check if post exists
  const post_exists = await post.findOne({ _id: post_id });
  if (!post_exists) {
    return res.status(404).json({ error: "Post not found" });
  }
  // Get all comment with their replies
  const list_comments = await comment
    .find({ post_id: post_id, parent_comment: null })
    .populate("author", "name")
    .populate({
      path: "replies",
      populate: { path: "author", select: "name" }, // Populate replies with author details
    })
    .sort({ createdAt: -1 });
  // response
  res.status(200).json(list_comments);
};
// DELETE /api/comment/{_id}/delete
export const delete_comment = async (req, res, next) => {
  const { _id } = req.params;
  // check if the comment is exist
  const comment_exists = await comment.findById(_id);
  if (!comment_exists) {
    return res.status(404).json({ message: "Comment not found" });
  }
  // Only the author or admin can delete the comment
  if (comment_exists.author.toString() !== req.user._id.toString()) {
    return res
      .status(403)
      .json({ message: "Unauthorized to delete this comment" });
  }
  // Delete all replies related this comment
  await comment.deleteMany({ parent_comment: _id });
  // Delete comment
  await comment.findByIdAndDelete(_id);
  if (comment_exists.parent_comment) {
    // If it's a reply, remove from parent's replies array
    await comment.findByIdAndUpdate(comment_exists.parent_comment, {
      $pull: { replies: _id },
    });
  } else {
    // If it's a top-level comment, delete comments related to post
    await post.findByIdAndUpdate(comment_exists.post_id, {
      $pull: { comments: _id },
    });
  }
  // response
  res.status(200).json({ message: "comment deleted successfully" });
};
