import Message from "../models/MessagesModel.js";
import fs from "fs";

export const getMessages = async (request, response, next) => {
  try {
    const user1 = request.userId;
    const user2 = request.body.id;

    if (!user1 || !user2) {
      return response.status(400).send("Both user Id is required");
    }

    const messages = await Message.find({
      $or: [
        { sender: user1, recipient: user2 },
        { sender: user2, recipient: user1 },
      ],
    }).sort({ timeStamp: 1 });

    return response.status(200).json({ messages });
  } catch (error) {
    console.log({ error });
    return response.status(500).send("Enternal Server Error");
  }
};

// upload Files
export const uploadFile = async (request, response, next) => {
  try {
    if (!request.file) {
      return response.status(400).send("file is required");
    }
    const date = Date.now();
    let fileDir = `uploads/files/${date}`;
    let fileName = `${fileDir}/${request.file.originalname}`;

    fs.mkdirSync(fileDir, { recursive: true });

    fs.renameSync(request.file.path, fileName);

    return response.status(200).json({ filePath: fileName });
  } catch (error) {
    console.log({ error });
    return response.status(500).send("Internal Server Error");
  }
};

// Upload audio file
export const uploadVoiceMessage = async (request, response, next) => {
  try {
    if (!request.file) {
      return response.status(400).send("Voice file is required");
    }

    // Validate file mime type
    if (!request.file.mimetype.startsWith("audio/")) {
      return response.status(400).send("File must be an audio file");
    }

    // Sanitize filename and generate unique name
    const timestamp = Date.now();
    const safeFileName =
      timestamp +
      "-" +
      request.file.originalname
        .replace(/[^a-zA-Z0-9.-]/g, "_")
        .substring(0, 200);

    const fileDir = `uploads/voice/${timestamp}`;
    const fileName = `${fileDir}/${safeFileName}`;

    await fs.promises.mkdir(fileDir, { recursive: true });
    await fs.promises.rename(request.file.path, fileName);

    return response.status(200).json({
      filePath: fileName,
      duration: request.body.duration || null, // If you're sending duration from client
    });
  } catch (error) {
    console.log({ error });
    // Clean up the temporary file if it exists and wasn't moved
    if (request.file && request.file.path) {
      try {
        await fs.promises.unlink(request.file.path);
      } catch (unlinkError) {
        // Ignore errors during cleanup
      }
    }
    return response.status(500).send("Internal Server Error");
  }
};
