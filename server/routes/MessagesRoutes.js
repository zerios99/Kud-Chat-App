import { Router } from "express";
import { verifyToken } from "../middlewares/AuthMiddleware.js";
import {
  getMessages,
  uploadFile,
  uploadVoiceMessage,
} from "../controllers/MessagesController.js";
import multer from "multer";
import fs from "fs";
import path from "path";

const messagesRoutes = Router();

// Ensure upload directories exist
const createUploadDirs = () => {
  const dirs = ["uploads/files", "uploads/voice"];
  dirs.forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

// Create directories on startup
createUploadDirs();

// Define allowed file types
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  // Allow common image types
  const allowedImageTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
    "image/bmp",
    "image/tiff",
  ];

  // Allow common document types
  const allowedDocumentTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "text/plain",
    "application/rtf",
    "application/json",
    "text/csv",
  ];

  // Allow common archive types
  const allowedArchiveTypes = [
    "application/zip",
    "application/x-zip-compressed",
    "application/x-rar-compressed",
    "application/vnd.rar",
    "application/x-7z-compressed",
    "application/x-tar",
    "application/gzip",
  ];

  // Allow common audio types
  const allowedAudioTypes = [
    "audio/webm",
    "audio/mp3",
    "audio/mpeg",
    "audio/wav",
    "audio/ogg",
    "audio/m4a",
    "audio/flac",
  ];

  // Allow common video types
  const allowedVideoTypes = [
    "video/mp4",
    "video/mpeg",
    "video/webm",
    "video/ogg",
    "video/x-matroska", // mkv
    "video/quicktime", // mov
    "video/x-msvideo", // avi
  ];
  const allowedExtensions = [
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".webp",
    ".svg",
    ".bmp",
    ".tiff",
    ".pdf",
    ".doc",
    ".docx",
    ".xls",
    ".xlsx",
    ".ppt",
    ".pptx",
    ".txt",
    ".rtf",
    ".csv",
    ".json",
    ".zip",
    ".rar",
    ".7z",
    ".tar",
    ".gz",
    ".mp3",
    ".wav",
    ".ogg",
    ".m4a",
    ".flac",
    ".webm",
    ".mp4",
    ".mkv",
    ".mov",
    ".avi",
    ".mpeg",
  ];

  const allAllowedTypes = [
    ...allowedImageTypes,
    ...allowedDocumentTypes,
    ...allowedArchiveTypes,
    ...allowedAudioTypes,
    ...allowedVideoTypes,
    ...allowedExtensions,
  ];

  if (
    allAllowedTypes.includes(file.mimetype) ||
    allowedExtensions.includes(ext)
  ) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Only images, documents, audio, video, and archive files are allowed."
      ),
      false
    );
  }
};

// Configure multer for different file types
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Check if file is an audio file
    if (file.mimetype.startsWith("audio/")) {
      cb(null, "uploads/voice");
    } else {
      cb(null, "uploads/files");
    }
  },
  filename: function (req, file, cb) {
    // Create safer filenames
    const fileExtension = path.extname(file.originalname);
    const fileName = `${Date.now()}-${Math.round(
      Math.random() * 1e9
    )}${fileExtension}`;
    cb(null, fileName);
  },
});

// Configure multer with limits and error handling
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB file size limit
  },
  fileFilter: fileFilter,
});

// Error handling middleware for multer errors
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        status: false,
        message: "File is too large. Maximum size is 50MB.",
      });
    }
    return res.status(400).json({
      status: false,
      message: `Upload error: ${err.message}`,
    });
  } else if (err) {
    return res.status(400).json({
      status: false,
      message: err.message,
    });
  }
  next();
};

messagesRoutes.post("/get-messages", verifyToken, getMessages);

messagesRoutes.post(
  "/upload-file",
  verifyToken,
  (req, res, next) =>
    upload.single("file")(req, res, (err) => {
      if (err) return handleMulterError(err, req, res, next);
      next();
    }),
  uploadFile
);

messagesRoutes.post(
  "/upload-voice",
  verifyToken,
  (req, res, next) =>
    upload.single("file")(req, res, (err) => {
      if (err) return handleMulterError(err, req, res, next);
      next();
    }),
  uploadVoiceMessage
);

export default messagesRoutes;
