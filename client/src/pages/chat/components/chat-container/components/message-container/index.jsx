import { useAppStore } from "@/store";
import { useEffect, useRef, useState } from "react";
import moment from "moment";
import { apiClient } from "@/lib/api-client";
import {
  GET_ALL_MESSAGES_ROUTES,
  GET_GROUP_MESSAGES_ROUTES,
  HOST,
} from "@/utils/constansts";
import { MdFolderZip } from "react-icons/md";
import { IoMdArrowRoundDown } from "react-icons/io";
import { IoCloseSharp } from "react-icons/io5";
import { FaPlay, FaPause, FaVolumeUp, FaVolumeMute } from "react-icons/fa";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getColor } from "@/lib/utils";

function MessageContainer() {
  const scrollRef = useRef();
  const {
    selectedChatType,
    selectedChatData,
    userInfo,
    setFileDownloadProgress,
    setIsDownloading,
    selectedChatMessages,
    setSelectedChatMessages,
  } = useAppStore();

  const [showImage, setShowImage] = useState(false);
  const [imageUrl, setImageUrl] = useState(null);
  const [currentAudio, setCurrentAudio] = useState(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState({});
  const [audioDurations, setAudioDurations] = useState({});
  const [audioCurrentTimes, setAudioCurrentTimes] = useState({});
  const [audioVolume, setAudioVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [showVolumeControl, setShowVolumeControl] = useState(null);

  useEffect(() => {
    const getMessages = async () => {
      try {
        const response = await apiClient.post(
          GET_ALL_MESSAGES_ROUTES,
          { id: selectedChatData._id },
          { withCredentials: true }
        );
        if (response.data.messages) {
          setSelectedChatMessages(response.data.messages);
        }
      } catch (error) {
        console.log(error);
      }
    };
    const getChannelMessages = async () => {
      try {
        const response = await apiClient.get(
          `${GET_GROUP_MESSAGES_ROUTES}/${selectedChatData._id}`,
          { withCredentials: true }
        );
        if (response.data.messages) {
          setSelectedChatMessages(response.data.messages);
        }
      } catch (error) {
        console.log(error);
      }
    };
    if (selectedChatData._id) {
      if (selectedChatType === "contact") getMessages();
      else if (selectedChatType === "channel") getChannelMessages();
    }
  }, [selectedChatData, selectedChatType, setSelectedChatMessages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedChatMessages]);

  const formatTime = (time) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? "0" + seconds : seconds}`;
  };

  const handleAudioPlayback = (voiceUrl) => {
    if (currentAudio) {
      currentAudio.pause();
      if (currentAudio.src.includes(voiceUrl) && isAudioPlaying) {
        setIsAudioPlaying(false);
        return;
      }
    }

    const audio = new Audio(`${HOST}/${voiceUrl}`);
    audio.volume = audioVolume;
    audio.muted = isMuted;
    setCurrentAudio(audio);

    // Load metadata first to get duration
    audio.addEventListener("loadedmetadata", () => {
      setAudioDurations((prev) => ({
        ...prev,
        [voiceUrl]: audio.duration,
      }));
      audio.play();
      setIsAudioPlaying(true);
    });

    audio.addEventListener("timeupdate", () => {
      const progress = (audio.currentTime / audio.duration) * 100;
      setAudioProgress((prev) => ({
        ...prev,
        [voiceUrl]: progress,
      }));
      setAudioCurrentTimes((prev) => ({
        ...prev,
        [voiceUrl]: audio.currentTime,
      }));
    });

    audio.addEventListener("ended", () => {
      setIsAudioPlaying(false);
      setAudioProgress((prev) => ({
        ...prev,
        [voiceUrl]: 0,
      }));
      setAudioCurrentTimes((prev) => ({
        ...prev,
        [voiceUrl]: 0,
      }));
    });
  };

  const handleAudioSeek = (voiceUrl, e) => {
    if (!currentAudio || !currentAudio.src.includes(voiceUrl)) return;

    const audioContainer = e.currentTarget;
    const clickPosition = e.nativeEvent.offsetX;
    const containerWidth = audioContainer.clientWidth;
    const seekPercentage = clickPosition / containerWidth;

    if (audioDurations[voiceUrl]) {
      const seekTime = audioDurations[voiceUrl] * seekPercentage;
      currentAudio.currentTime = seekTime;

      setAudioCurrentTimes((prev) => ({
        ...prev,
        [voiceUrl]: seekTime,
      }));

      setAudioProgress((prev) => ({
        ...prev,
        [voiceUrl]: seekPercentage * 100,
      }));
    }
  };

  const toggleMute = () => {
    if (currentAudio) {
      currentAudio.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setAudioVolume(newVolume);

    if (currentAudio) {
      currentAudio.volume = newVolume;
      if (newVolume === 0) {
        currentAudio.muted = true;
        setIsMuted(true);
      } else if (isMuted) {
        currentAudio.muted = false;
        setIsMuted(false);
      }
    }
  };

  const checkIfImage = (filePath) => {
    const imageRegex =
      /\.(jpg|jpeg|png|gif|bmp|tiff|tif|webp|svg|ico|heic|heif)$/i;
    return imageRegex.test(filePath);
  };

  const renderMessages = () => {
    let lastDate = null;
    return selectedChatMessages.map((message, index) => {
      const messageData = moment(message.timeStamp).format("YYYY-MM-DD");
      const showDate = messageData !== lastDate;
      lastDate = messageData;
      return (
        <div key={index}>
          {showDate && (
            <div className="text-center text-gray-500 my-2">
              {moment(message.timeStamp).format("LL")}
            </div>
          )}
          {selectedChatType === "contact" && renderDMMessages(message)}
          {selectedChatType === "channel" && renderChannelMessages(message)}
        </div>
      );
    });
  };

  const downloadFile = async (url) => {
    setIsDownloading(true);
    setFileDownloadProgress(0);
    try {
      const response = await apiClient.get(`${HOST}/${url}`, {
        responseType: "blob",
        onDownloadProgress: (progressEvent) => {
          const { loaded, total } = progressEvent;
          const percentCompleted = Math.round((loaded * 100) / total);
          setFileDownloadProgress(percentCompleted);
        },
      });
      const urlBlob = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = urlBlob;
      link.setAttribute("download", url.split("/").pop());
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(urlBlob);
    } catch (error) {
      console.error("Download failed:", error);
    }
    setIsDownloading(false);
    setFileDownloadProgress(0);
  };

  const renderAudioPlayer = (message, voiceUrl) => (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => handleAudioPlayback(voiceUrl)}
          className="bg-black/20 p-3 text-xl rounded-full hover:bg-black/50 cursor-pointer transition-all duration-300"
        >
          {currentAudio &&
          currentAudio.src.includes(voiceUrl) &&
          isAudioPlaying ? (
            <FaPause />
          ) : (
            <FaPlay />
          )}
        </button>

        <div
          className="w-32 h-2 bg-gray-700 rounded-full overflow-hidden cursor-pointer relative flex-1"
          onClick={(e) => handleAudioSeek(voiceUrl, e)}
        >
          <div
            className="h-full bg-[#8417ff] rounded-full"
            style={{
              width: `${audioProgress[voiceUrl] || 0}%`,
            }}
          ></div>
        </div>

        <div className="flex items-center gap-2">
          <button
            className="bg-black/20 p-2 text-sm rounded-full hover:bg-black/50 cursor-pointer transition-all duration-300"
            onClick={toggleMute}
            onMouseEnter={() => setShowVolumeControl(voiceUrl)}
          >
            {isMuted ? <FaVolumeMute /> : <FaVolumeUp />}
          </button>

          <button
            className="bg-black/20 p-2 text-sm rounded-full hover:bg-black/50 cursor-pointer transition-all duration-300"
            onClick={() => downloadFile(voiceUrl)}
          >
            <IoMdArrowRoundDown />
          </button>
        </div>
      </div>

      <div className="flex justify-between text-xs text-gray-400">
        <span>{formatTime(audioCurrentTimes[voiceUrl] || 0)}</span>
        <span>{formatTime(audioDurations[voiceUrl] || 0)}</span>
      </div>

      {showVolumeControl === voiceUrl && (
        <div
          className="mt-2 p-2 bg-black/30 rounded-lg"
          onMouseLeave={() => setShowVolumeControl(null)}
        >
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={audioVolume}
            onChange={handleVolumeChange}
            className="w-full h-1 bg-gray-700 rounded-full appearance-none cursor-pointer"
          />
        </div>
      )}
    </div>
  );

  const renderDMMessages = (message) => (
    <div
      className={`${
        message.sender === selectedChatData._id ? "text-left" : "text-right"
      }`}
    >
      {message.messageType === "text" && (
        <div
          className={`${
            message.sender !== selectedChatData._id
              ? "bg-[#8417ff]/5 text-[#8417ff]/90 border-[#8417ff]/50"
              : "bg-[#2a2b33]/5 text-white/80 border-white/20"
          } border inline-block p-4 rounded my-1 max-w-[50%] break-words`}
        >
          {message.content}
        </div>
      )}
      {message.messageType === "file" && (
        <div
          className={`${
            message.sender !== selectedChatData._id
              ? "bg-[#8417ff]/5 text-[#8417ff]/90 border-[#8417ff]/50"
              : "bg-[#2a2b33]/5 text-white/80 border-white/20"
          } border inline-block p-4 rounded my-1 max-w-[50%] break-words`}
        >
          {checkIfImage(message.fileUrl) ? (
            <div
              className="cursor-pointer"
              onClick={() => {
                setShowImage(true);
                setImageUrl(message.fileUrl);
              }}
            >
              <img
                src={`${HOST}/${message.fileUrl}`}
                height={300}
                width={300}
                alt="Shared image"
                className="max-w-full rounded"
              />
            </div>
          ) : (
            <div className="flex items-center justify-center gap-4">
              <span className="text-white/80 text-3xl bg-black/20 rounded-full p-3">
                <MdFolderZip />
              </span>
              <span>{message.fileUrl.split("/").pop()}</span>
              <span
                className="bg-black/20 p-3 text-2xl rounded-full hover:bg-black/50 cursor-pointer transition-all duration-300"
                onClick={() => downloadFile(message.fileUrl)}
              >
                <IoMdArrowRoundDown />
              </span>
            </div>
          )}
        </div>
      )}
      {message.messageType === "voice" && (
        <div
          className={`${
            message.sender !== selectedChatData._id
              ? "bg-[#8417ff]/5 text-[#8417ff]/90 border-[#8417ff]/50"
              : "bg-[#2a2b33]/5 text-white/80 border-white/20"
          } border inline-block p-4 rounded my-1 max-w-[50%] break-words`}
        >
          {renderAudioPlayer(message, message.voiceUrl)}
        </div>
      )}
      <div className="text-xs text-gray-600">
        {moment(message.timeStamp).format("LT")}
      </div>
    </div>
  );

  const renderChannelMessages = (message) => {
    return (
      <div
        className={`mt-5 ${
          message.sender._id !== userInfo.id ? " text-left" : " text-right"
        }`}
      >
        {message.messageType === "text" && (
          <div
            className={`${
              message.sender._id === userInfo.id
                ? "bg-[#8417ff]/5 text-white/80 border-[#8417ff]/50"
                : "bg-[#2a2b33]/5 text-white/80 border-white/20"
            } border inline-block p-4 rounded my-1 max-w-[50%] break-words ml-9`}
          >
            {message.content}
          </div>
        )}
        {message.messageType === "file" && (
          <div
            className={`${
              message.sender._id === userInfo.id
                ? "bg-[#8417ff]/5 text-[#8417ff]/90 border-[#8417ff]/50"
                : "bg-[#2a2b33]/5 text-white/80 border-white/20"
            } border inline-block p-4 rounded my-1 max-w-[50%] break-words`}
          >
            {checkIfImage(message.fileUrl) ? (
              <div
                className="cursor-pointer"
                onClick={() => {
                  setShowImage(true);
                  setImageUrl(message.fileUrl);
                }}
              >
                <img
                  src={`${HOST}/${message.fileUrl}`}
                  height={300}
                  width={300}
                  alt="Shared image"
                  className="max-w-full rounded"
                />
              </div>
            ) : (
              <div className="flex items-center justify-center gap-4">
                <span className="text-white/80 text-3xl bg-black/20 rounded-full p-3">
                  <MdFolderZip />
                </span>
                <span>{message.fileUrl.split("/").pop()}</span>
                <span
                  className="bg-black/20 p-3 text-2xl rounded-full hover:bg-black/50 cursor-pointer transition-all duration-300"
                  onClick={() => downloadFile(message.fileUrl)}
                >
                  <IoMdArrowRoundDown />
                </span>
              </div>
            )}
          </div>
        )}
        {message.messageType === "voice" && (
          <div
            className={`${
              message.sender._id === userInfo.id
                ? "bg-[#8417ff]/5 text-[#8417ff]/90 border-[#8417ff]/50"
                : "bg-[#2a2b33]/5 text-white/80 border-white/20"
            } border inline-block p-4 rounded my-1 max-w-[50%] break-words ml-9`}
          >
            {renderAudioPlayer(message, message.voiceUrl)}
          </div>
        )}
        {message.sender._id !== userInfo.id ? (
          <div className="flex items-center justify-start gap-3">
            <Avatar className="w-8 h-8 rounded-full overflow-hidden">
              {message.sender.image && (
                <AvatarImage
                  src={`${HOST}/${message.sender.image}`}
                  alt="profile"
                  className="object-cover w-full h-full bg-black rounded-full"
                />
              )}
              <AvatarFallback
                className={`uppercase h-8 w-8 text-lg border-[1px] flex items-center justify-center rounded-full overflow-hidden ${getColor(
                  message.sender.color
                )}`}
              >
                {message.sender.firstName
                  ? message.sender.firstName.split("").shift()
                  : message.sender.email.split("").shift()}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-white/60">{`${message.sender.firstName} ${message.sender.lastName}`}</span>
            <span className="text-xs text-white/60">
              {moment(message.timeStamp).format("LT")}
            </span>
          </div>
        ) : (
          <div className="text-xs text-white/60 mt-1">
            {moment(message.timeStamp).format("LT")}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex-1 overflow-y-scroll scrollbar-hide p-4 px-8 md:w-[65vw] lg:w-[70vw] xl:w-[80vw] w-full">
      {renderMessages()}
      <div ref={scrollRef} />
      {showImage && (
        <div className="fixed z-[1000] top-0 left-0 h-[100vh] w-[100vw] flex items-center justify-center backdrop-blur-lg flex-col">
          <div>
            <img
              src={`${HOST}/${imageUrl}`}
              className="h-[80vh] w-full bg-cover object-contain"
              alt="Full size view"
            />
          </div>
          <div className="flex gap-5 fixed top-0 mt-5">
            <button
              className="bg-black/20 p-3 text-2xl rounded-full hover:bg-black/50 cursor-pointer transition-all duration-300"
              onClick={() => downloadFile(imageUrl)}
            >
              <IoMdArrowRoundDown />
            </button>
            <button
              className="bg-black/20 p-3 text-2xl rounded-full hover:bg-black/50 cursor-pointer transition-all duration-300"
              onClick={() => {
                setShowImage(false);
                setImageUrl(null);
              }}
            >
              <IoCloseSharp />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default MessageContainer;
