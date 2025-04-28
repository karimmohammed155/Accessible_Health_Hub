import { post } from "../../../DB/models/post.model.js";
import { asyncHandler, sendEmail, cloudinary } from "./../../utils/index.js";
import { User, Token } from "./../../../DB/models/index.js";
import bcrypt from "bcrypt";
import { nanoid } from "nanoid";
import jwt from "jsonwebtoken";
import randomstring from "randomstring";
import { Admin } from "../../../DB/models/adminModel.js";

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
