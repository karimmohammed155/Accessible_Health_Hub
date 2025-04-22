import { post } from "../../../DB/models/post.model.js";
import { asyncHandler, sendEmail, cloudinary } from "./../../utils/index.js";
import { User, Token } from "./../../../DB/models/index.js";
import bcrypt from "bcrypt";
import { nanoid } from "nanoid";
import jwt from "jsonwebtoken";
import randomstring from "randomstring";
import { Admin } from "../../../DB/models/adminModel.js";
import { comment, interaction } from "../../../DB/models/index.js";


export const register = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (user) return next(new Error("User already registered", { cause: 412 }));

  const hashedPassword = await bcrypt.hash(
    password,
    parseInt(process.env.SALT_ROUND)
  );
  const cloudFolder = nanoid();

  let profileImage;

  // Check if there's an uploaded file
  if (req.files && req.files.profileImage) {
    const file = req.files.profileImage[0];
    const { secure_url, public_id } = await cloudinary.uploader.upload(
      file.path,
      {
        folder: `${process.env.CLOUD_FOLDER_NAME}/admin/${cloudFolder}`,
      }
    );
    profileImage = { id: public_id, url: secure_url };
  } else {
    profileImage = {
      id: "default_public_id",
      url: `https://res.cloudinary.com/${process.env.CLOUDNAME}/image/upload/v1741439525/download_uoxufk.jpg`,
    };
  }
  // Create the user
  await Admin.create({
    ...req.body,
    password: hashedPassword,
    cloudFolder,
    profileImage,
  });

  const token = jwt.sign({ email }, process.env.SECRET_KEY);

  const confirmationLink = `https://knowledge-sharing-pied.vercel.app/admin/activate_account/${token}`;
  //send email
  const messageSent = await sendEmail({
    to: email,
    subject: "Activate account",
    html: `<a href=${confirmationLink}>Activate account</a>`,
  });
  if (!messageSent) return next(new Error("Something went wrong!"));

  return res.status(200).json({
    success: true,
    message: "User created successfully",
  });
});

export const activate_account = asyncHandler(async (req, res, next) => {
  const { token } = req.params;
  const { email } = jwt.verify(token, process.env.SECRET_KEY);

  const user = await Admin.findOneAndUpdate(
    { email },
    { is_email_verified: true }
  );

  if (!user) return next(new Error("User not found!", { cause: 404 }));

  return res.status(200).json({
    success: true,
    message: "Account activated successfully, try to login now:)",
  });
});

export const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  const user = await Admin.findOne({ email });

  if (!user) return next(new Error("User not found!", { cause: 404 }));

  if (!user.is_email_verified)
    return next(new Error("You have to activate your account first!"));

  const match = bcrypt.compareSync(password, user.password);
  if (!match) return next(new Error("Invalid password!"));

  const token = jwt.sign(
    { email, id: user._id, role: user.role },
    process.env.SECRET_KEY,
    { expiresIn: "30d" }
  );
  const expirationDate = new Date();
  expirationDate.setHours(expirationDate.getHours() + 5);

  await Token.create({ token, user: user._id, expiredAt: expirationDate });

  return res.json({
    success: true,
    message: "User logged in successfully!",
    token: token,
  });
});

export const forgetPassword = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  const user = await Admin.findOne({ email });

  if (!user) return next(new Error("User not found!", { cause: 404 }));

  if (!user.is_email_verified)
    return next(
      new Error("You have to verify your email first", { cause: 403 })
    );

  const forgetCode = randomstring.generate({
    length: 5,
    charset: "numeric",
  });

  user.forgetCode = forgetCode;
  await user.save();

  //send email
  const messageSent = await sendEmail({
    to: email,
    subject: "Forget password",
    html: `<h1>${forgetCode}</h1>`,
  });
  if (!messageSent) return next(new Error("Something went wrong!"));

  return res.json({
    success: true,
    message: "Forget code sent to user successfully",
    forgetCode,
  });
});

export const resetPassword = asyncHandler(async (req, res, next) => {
  const { email, password, forgetCode } = req.body;

  const user = await Admin.findOne({ email });

  if (!user) return next(new Error("User not found!", { cause: 404 }));

  if (forgetCode !== user.forgetCode)
    return next(new Error("Invalid code!", { cause: 406 }));

  user.password = await bcrypt.hash(password, parseInt(process.env.SALT_ROUND));
  await user.save();

  const tokens = await Token.find({ user: user._id });

  tokens.forEach(async (token) => {
    (token.isValid = false), await token.save();
  });

  return res.json({
    success: true,
    message: "Try to login now :)",
  });
});


export const get_flagged_posts = asyncHandler(async (req, res, next) => {
  const flaggedPosts=await post.find({isFlagged:true});
  return res.json({
    success:true,
    results:{
        flaggedPosts
    }
  });
});

export const deactivate_user = asyncHandler(async (req, res, next) => {
  const { postId } = req.params;

  // 1. Find the flagged post by ID
  const flaggedPost = await post.findOne({ _id: postId, isFlagged: true });

  if (!flaggedPost) {
    return res.status(404).json({
      success: false,
      message: "Flagged post not found",
    });
  }

  // 2. Deactivate the user who authored the post
  const user = await User.findById(flaggedPost.author);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "Author of the post not found",
    });
  }

  user.isActive = false;
  user.deactivatedUntil = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000); // 15 days
  await user.save();

  res.json({
    success: true,
    message: `User who posted the flagged content has been deactivated for 15 days.`,
    deactivatedUntil: user.deactivatedUntil,
  });
});

export const getAllNationalIds = asyncHandler(async (req, res, next) => {
  const doctors = await User.find({ role: "doctor", nationalID: { $ne: null } });

  const nationalIds = doctors.map(doctor => doctor.nationalID);

  return res.status(200).json({
    success: true,
    data: nationalIds,
  });
});

export const verifyDoctor = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;



  // Find the user (doctor) by userId
  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found.",
    });
  }

  // Ensure the user is a doctor and has a national ID uploaded
  if (user.role !== "doctor") {
    return res.status(400).json({
      success: false,
      message: "Only doctor accounts can be verified.",
    });
  }

  if (!user.nationalID) {
    return res.status(400).json({
      success: false,
      message: "Doctor has not uploaded a national ID for verification.",
    });
  }

  // Ensure the doctor is not already verified
  if (user.isVerified) {
    return res.status(400).json({
      success: false,
      message: "Doctor is already verified.",
    });
  }

  // Update the user's verification status
  user.isVerified = true;
  await user.save();

  // Optionally, send a notification email to the doctor (you can use sendEmail here)
  const emailMessage = await sendEmail({
    to: user.email,
    subject: "Doctor Account Verified",
    html: `<p>Your account has been successfully verified. You can now access all the doctor features.</p>`,
  });

  if (!emailMessage) {
    return res.status(500).json({
      success: false,
      message: "Failed to send verification notification email.",
    });
  }

  // Return success response
  return res.status(200).json({
    success: true,
    message: `Doctor ${user.name} has been successfully verified.`,
  });
});

export const delete_post = async (req, res, next) => {
  const { post_id } = req.params;

  try {
    // 1. Fetch post
    const find_post = await post.findById(post_id);
    
    // 2. If post not found, return 404
    if (!find_post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // 3. Authorization check (user or admin can delete)
    const isAuthor = req.user && find_post.author.toString() === req.user._id.toString();
    const isAdmin = !!req.admin;

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({ message: "Unauthorized to delete this post" });
    }

    // 4. Delete post assets from Cloudinary
    if (find_post.files?.custom_id) {
      const post_path = `${process.env.CLOUD_FOLDER_NAME}/posts/${find_post.files.custom_id}`;
      try {
        await cloudinary.api.delete_resources_by_prefix(post_path);
        await cloudinary.api.delete_folder(post_path);
      } catch (err) {
        console.error("Error deleting post assets from Cloudinary:", err.message);
        // Continue deletion process even if cloud delete fails
      }
    }
    // 5. Remove related comments and interactions
    await comment.deleteMany({ post_id });
    await interaction.deleteMany({ post_id });

    // 6. Delete the post itself
    await post.findByIdAndDelete(post_id);

    // 7. Respond
    return res.status(200).json({ message: "Post deleted successfully" });

  } catch (error) {
    console.error("Error deleting post:", error);
    return res.status(500).json({ message: "An error occurred", error: error.message });
  }
};
