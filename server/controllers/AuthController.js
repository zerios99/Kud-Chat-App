import User from "../models/UserModel.js";
import jwt from "jsonwebtoken";
import { compare } from "bcrypt";
import { renameSync, unlinkSync } from "fs";

const maxAge = 3 * 24 * 60 * 60 * 1000;
const createToken = (email, userId) => {
  return jwt.sign({ email, userId }, process.env.JWT_KEY, {
    expiresIn: maxAge,
  });
};

// Signup
export const signup = async (request, response, next) => {
  try {
    const { email, password } = request.body;
    if (!email || !password) {
      return response.status(400).send("Please provide email and password");
    }
    const user = await User.create({ email, password });
    response.cookie("jwt", createToken(email, user.id), {
      maxAge,
      secure: true,
      sameSite: "None",
    });
    return response.status(201).json({
      user: {
        email: user.email,
        id: user.id,
        profileSetup: user.profileSetup,
      },
    });
  } catch (error) {
    console.log({ error });
    return response.status(500).send("Enternal Server Error");
  }
};

// login
export const login = async (request, response, next) => {
  try {
    const { email, password } = request.body;
    if (!email || !password) {
      return response.status(400).send("Please provide email and password");
    }
    const user = await User.findOne({ email });
    if (!user) {
      return response.status(404).send("Invalid credentials");
    }
    const auth = await compare(password, user.password);
    if (!auth) {
      return response.status(400).send("Invalid credentials");
    }

    response.cookie("jwt", createToken(email, user.id), {
      maxAge,
      secure: true,
      sameSite: "None",
    });
    return response.status(200).json({
      user: {
        email: user.email,
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        image: user.image,
        color: user.color,
        profileSetup: user.profileSetup,
      },
    });
  } catch (error) {
    console.log({ error });
    return response.status(500).send("Internal Server Error");
  }
};

// Get User Info
export const getUserInfo = async (request, response, next) => {
  try {
    const userData = await User.findById(request.userId);
    if (!userData) {
      return response.status(404).send("Your data is not correct");
    }
    return response.status(200).json({
      email: userData.email,
      id: userData.id,
      firstName: userData.firstName,
      lastName: userData.lastName,
      image: userData.image,
      color: userData.color,
      profileSetup: userData.profileSetup,
    });
  } catch (error) {
    console.log({ error });
    return response.status(500).send("Enternal Server Error");
  }
};

// Update Profile
export const updateProfile = async (request, response, next) => {
  try {
    const { userId } = request;
    const { firstName, lastName, color } = request.body;

    if (!firstName || !lastName) {
      return response.status(400).send("First name and last name are required");
    }

    const userData = await User.findByIdAndUpdate(
      userId,
      { firstName, lastName, color, profileSetup: true },
      { new: true, runValidators: true }
    );

    if (!userData) {
      return response.status(404).send("User not found");
    }

    return response.status(200).json({
      email: userData.email,
      id: userData.id,
      firstName: userData.firstName,
      lastName: userData.lastName,
      image: userData.image,
      color: userData.color,
      profileSetup: userData.profileSetup,
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return response.status(500).send("Internal Server Error");
  }
};

// Add Profile Image
export const addProfileImage = async (request, response, next) => {
  try {
    if (!request.file) {
      return response.status(400).send("Please upload an image");
    }

    const date = Date.now();
    let fileName = "uploads/profiles/" + date + request.file.originalname;
    renameSync(request.file.path, fileName);

    const updatedUser = await User.findByIdAndUpdate(
      request.userId,
      { image: fileName },
      { new: true, runValidators: true }
    );

    return response.status(200).json({
      image: updatedUser.image,
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return response.status(500).send("Internal Server Error");
  }
};

// remove Profile Image
export const removeProfileImage = async (request, response, next) => {
  try {
    const { userId } = request;
    const user = await User.findById(userId);

    if (!user) {
      return response.status(404).send("User not found");
    }

    if (user.image) {
      unlinkSync(user.image);
    }

    user.image = null;
    await user.save();

    return response.status(200).send("Image removed successfully");
  } catch (error) {
    console.error("Error updating profile:", error);
    return response.status(500).send("Internal Server Error");
  }
};

// logout
export const logout = async (request, response, next) => {
  try {
    response.cookie("jwt", "", { maxAge: 1, secure: true, sameSite: "None" });
    return response.status(200).send("Logout Successfull");
  } catch (error) {
    console.log({ error });
    return response.status(500).send("Enternal Server Error");
  }
};
