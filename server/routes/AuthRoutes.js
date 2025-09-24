import { Router } from "express";
import {
  signup,
  login,
  getUserInfo,
  updateProfile,
  addProfileImage,
  removeProfileImage,
  logout,
} from "../controllers/AuthController.js";
import { verifyToken } from "../middlewares/AuthMiddleware.js";
import multer from "multer";

const authRoutes = Router();
const upload = multer({ dest: "uploads/profiles/" });

authRoutes.post("/signup", signup);
authRoutes.post("/login", login);
authRoutes.get("/userInfo", verifyToken, getUserInfo);
authRoutes.post("/updateProfile", verifyToken, updateProfile);
authRoutes.post(
  "/addProfileImage",
  verifyToken,
  upload.single("profileImage"),
  addProfileImage
);
authRoutes.delete("/removeProfileImage", verifyToken, removeProfileImage);
authRoutes.post("/logout", logout);

export default authRoutes;
