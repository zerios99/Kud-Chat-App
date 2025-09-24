import { useSocket } from "@/context/SocketContext";
import { apiClient } from "@/lib/api-client";
import { useAppStore } from "@/store";
import { UPLOAD_FILE_ROUTE } from "@/utils/constansts";
import EmojiPicker from "emoji-picker-react";
import { useEffect, useRef, useState } from "react";
import { GrAttachment } from "react-icons/gr";
import { IoSend } from "react-icons/io5";
import { RiEmojiStickerLine } from "react-icons/ri";
import { toast } from "react-hot-toast";
import { FaMicrophone } from "react-icons/fa";
import CaptureAudio from "@/common/CaptureAudio";

function MessageBar() {
  const emojiRef = useRef();
  const fileInputRef = useRef();
  const formRef = useRef();
  const socket = useSocket();
  const {
    selectedChatType,
    selectedChatData,
    userInfo,
    setIsUploading,
    setFileUploadProgress,
  } = useAppStore();
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [showAudioRecorder, setShowAudioRecorder] = useState(false);

  useEffect(() => {
    function handleClickOutside(event) {
      if (emojiRef.current && !emojiRef.current.contains(event.target)) {
        setEmojiPickerOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handelAddEmoji = (emoji) => {
    setMessage((msg) => msg + emoji.emoji);
  };

  const sendSocketMessage = (messageType, content, fileUrl, voiceUrl) => {
    if (!socket) {
      toast.error("Socket not connected yet.");
      return;
    }

    if (!selectedChatData) {
      toast.error("No chat selected.");
      return;
    }

    const messageData = {
      sender: userInfo.id,
      content,
      messageType,
      ...(fileUrl && { fileUrl }),
      ...(voiceUrl && { voiceUrl }),
      ...(selectedChatType === "contact"
        ? { recipient: selectedChatData._id }
        : { channelId: selectedChatData._id }),
    };

    const eventName =
      selectedChatType === "contact" ? "sendMessage" : "send-channel-message";

    socket.emit(eventName, messageData);
  };

  const handelSendMessage = async (e) => {
    if (e) e.preventDefault();
    const trimmedMessage = message.trim();
    if (!trimmedMessage) return;
    sendSocketMessage("text", trimmedMessage);
    setMessage("");
  };

  const handleAttachmentClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleAttachmentChange = async (event) => {
    try {
      const file = event.target.files[0];
      if (!file) return;

      const maxSize = 50 * 1024 * 1024; // 50MB
      if (file.size > maxSize) {
        toast.error("File is too large. Maximum size is 50MB.");
        return;
      }

      const formData = new FormData();
      formData.append("file", file);
      setIsUploading(true);

      const response = await apiClient.post(UPLOAD_FILE_ROUTE, formData, {
        withCredentials: true,
        onUploadProgress: (data) =>
          setFileUploadProgress(Math.round((100 * data.loaded) / data.total)),
      });

      if (response.status === 200 && response.data) {
        setIsUploading(false);
        sendSocketMessage("file", undefined, response.data.filePath);
        toast.success("File uploaded successfully");
      }
    } catch (error) {
      setIsUploading(false);
      console.error("Error uploading file:", error);
      toast.error("Failed to upload file. Please try again.");
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="h-[60px] md:h-[10vh] bg-[#1c1d25] flex justify-center items-center px-2 sm:px-4 md:px-8 mb-2 md:mb-5 gap-2 md:gap-6">
      {!showAudioRecorder && (
        <>
          <form
            ref={formRef}
            onSubmit={handelSendMessage}
            className="flex-1 flex bg-[#2a2b33] rounded-md items-center gap-2 md:gap-5 pr-2 md:pr-5"
          >
            <input
              type="text"
              className="flex-1 py-3 px-2 md:p-5 bg-transparent rounded-md focus:border-none focus:outline-none text-sm md:text-base"
              placeholder="Type a message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              aria-label="Message input"
            />
            <button
              type="button"
              className="text-neutral-500 p-1 md:p-2 focus:border-none focus:outline-none focus:text-white duration-300 transition-all"
              onClick={handleAttachmentClick}
              aria-label="Attach file"
            >
              <GrAttachment className="text-xl md:text-2xl" />
            </button>
            <input
              type="file"
              className="hidden"
              ref={fileInputRef}
              onChange={handleAttachmentChange}
              aria-hidden="true"
            />
            <div className="relative">
              <button
                type="button"
                className="text-neutral-500 p-1 md:p-2 focus:border-none focus:outline-none focus:text-white duration-300 transition-all"
                onClick={() => setEmojiPickerOpen(true)}
                aria-label="Open emoji picker"
              >
                <RiEmojiStickerLine className="text-xl md:text-2xl" />
              </button>
              {emojiPickerOpen && (
                <div
                  className="absolute bottom-12 md:bottom-16 right-0 z-50"
                  ref={emojiRef}
                >
                  <EmojiPicker
                    theme="dark"
                    open={emojiPickerOpen}
                    onEmojiClick={handelAddEmoji}
                    autoFocusSearch={false}
                  />
                </div>
              )}
            </div>

            <button
              type="submit"
              tabIndex={-1}
              className="hidden"
              aria-hidden="true"
            />
          </form>
          <button
            type="button"
            className="bg-[#8340FF] hover:bg-[#741bda] focus:bg-[#741bda] rounded-md flex items-center justify-center p-3 md:p-5 focus:border-none focus:outline-none duration-300 transition-all"
          >
            {message.length ? (
              <IoSend
                className="text-xl md:text-2xl"
                onClick={handelSendMessage}
                aria-label="Send message"
              />
            ) : (
              <FaMicrophone
                className="text-panel-header-icon cursor-pointer text-xl"
                title="recorder"
                onClick={() => setShowAudioRecorder(true)}
              />
            )}
          </button>
        </>
      )}
      {showAudioRecorder && <CaptureAudio hide={setShowAudioRecorder} />}
    </div>
  );
}

export default MessageBar;
