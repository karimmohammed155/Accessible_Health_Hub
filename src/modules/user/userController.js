import { asyncHandler, sendEmail, cloudinary } from "./../../utils/index.js";
import { User, Token } from "./../../../DB/models/index.js";
import bcrypt from "bcrypt";
import { nanoid } from "nanoid";
import jwt from "jsonwebtoken";
import randomstring from "randomstring";

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
        folder: `${process.env.CLOUD_FOLDER_NAME}/user/${cloudFolder}`,
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
  await User.create({
    ...req.body,
    password: hashedPassword,
    cloudFolder,
    profileImage,
  });

  const token = jwt.sign({ email }, process.env.SECRET_KEY);

  const confirmationLink = `http://localhost:3000/user/activate_account/${token}`;
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

  const user = await User.findOneAndUpdate(
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

  const user = await User.findOne({ email });

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

  const user = await User.findOne({ email });

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

  const user = await User.findOne({ email });

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

export const updateUser = asyncHandler(async (req, res, next) => {
  const user = req.user;
  const nameFromBody = req.body.name;
  const nameFromFile = req.files?.name;
  console.log(user);

  if (req.files && req.files.profileImage) {
    const file = req.files.profileImage[0];
    const { secure_url, public_id } = await cloudinary.uploader.upload(
      file.path,
      {
        folder: `${process.env.CLOUD_FOLDER_NAME}/user/${user.cloudFolder}`,
      }
    );
    user.profileImage = { id: public_id, url: secure_url };
    await user.save();
  }

  if (nameFromBody || nameFromFile) {
    const name = nameFromBody || nameFromFile;

    user.name = name;
    await user.save();
  }

  return res.json({
    success: true,
    message: "User updated successfully!",
  });
});

export const deleteUser = asyncHandler(async (req, res, next) => {
  const user = req.user;

  if (!user) {
    return next(new Error("User not found!", { cause: 404 }));
  }

  // Delete user tokens
  await Token.deleteMany({ user: user._id });

  // Delete user profile image from Cloudinary if not default
  if (user.profileImage && user.profileImage.id !== "default_public_id") {
    await cloudinary.uploader.destroy(user.profileImage.id);
  }

  // Delete the user
  await User.findOneAndDelete({ email: user.email });

  return res.json({
    success: true,
    message: "Your account has been deleted successfully",
  });
});
