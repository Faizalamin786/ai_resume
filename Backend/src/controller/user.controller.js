import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";

const cookieOptions = {
  httpOnly: true,
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
  sameSite: "none",
  secure: true,
};

const start = async (req, res) => {
  if (req.user) {
    return res.status(200).json(new ApiResponse(200, req.user, "User Found"));
  }

  return res
    .status(404)
    .json(new ApiError(404, "User not authenticated."));
};

const registerUser = async (req, res) => {
  console.log("Registration Started");

  const { fullName, email, password } = req.body;

  if (!fullName || !email || !password) {
    return res
      .status(400)
      .json(
        new ApiError(
          400,
          "Please provide all required fields: fullName, email, and password."
        )
      );
  }

  try {
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res
        .status(409)
        .json(new ApiError(409, "User already registered."));
    }

    const newUser = await User.create({
      fullName,
      email,
      password,
    });

    return res.status(201).json(
      new ApiResponse(
        201,
        {
          user: {
            id: newUser._id,
            fullName: newUser.fullName,
            email: newUser.email,
          },
        },
        "User successfully registered."
      )
    );
  } catch (err) {
    console.error("Error while creating user:", err);
    return res
      .status(500)
      .json(new ApiError(500, "Internal Server Error.", [], err.stack));
  }
};

const loginUser = async (req, res) => {
  console.log("Login Started");

  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json(
        new ApiError(
          400,
          "Please provide all required fields: email and password."
        )
      );
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json(new ApiError(404, "User not found."));
    }

    const isPasswordCorrect = await user.comparePassword(password);

    if (!isPasswordCorrect) {
      return res.status(406).json(new ApiError(406, "Invalid credentials."));
    }

    const jwtToken = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET_KEY,
      { expiresIn: process.env.JWT_SECRET_EXPIRES_IN || "1d" }
    );

    return res
      .cookie("token", jwtToken, cookieOptions)
      .status(200)
      .json(
        new ApiResponse(
          200,
          {
            user: {
              id: user._id,
              email: user.email,
              fullName: user.fullName,
            },
          },
          "User logged in successfully."
        )
      );
  } catch (err) {
    console.error("Error during login:", err);
    return res
      .status(500)
      .json(new ApiError(500, "Internal Server Error", [], err.stack));
  }
};

const logoutUser = (req, res) => {
  return res
    .clearCookie("token", {
      httpOnly: true,
      sameSite: "none",
      secure: true,
    })
    .status(200)
    .json(new ApiResponse(200, null, "User logged out successfully."));
};

export { start, loginUser, logoutUser, registerUser };