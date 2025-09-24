import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
    required: true,
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
    required: false,
  },
  messageType: {
    type: String,
    enum: ["text", "file", "voice"],
    required: true,
  },
  content: {
    type: String,
  },
  fileUrl: {
    type: String,
  },
  voiceUrl: {
    type: String,
  },
  timeStamp: {
    type: Date,
    default: Date.now,
  },
});

// custom validator
messageSchema.pre("validate", function (next) {
  if (this.messageType === "text" && !this.content) {
    this.invalidate("content", "Content is required for text messages.");
  }
  if (this.messageType === "file" && !this.fileUrl) {
    this.invalidate("fileUrl", "fileUrl is required for file messages.");
  }
  if (this.messageType === "voice" && !this.voiceUrl) {
    this.invalidate("voiceUrl", "voiceUrl is required for voice messages.");
  }
  next();
});

const Message = mongoose.model("Messages", messageSchema);

export default Message;
