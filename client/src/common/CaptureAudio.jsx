import { apiClient } from "@/lib/api-client";
import { useAppStore } from "@/store";
import { UPLOAD_VOICE_ROUTE } from "@/utils/constansts";
import { useEffect, useRef, useState } from "react";
import {
  FaMicrophone,
  FaPauseCircle,
  FaPlay,
  FaStop,
  FaTrash,
} from "react-icons/fa";
import { MdSend } from "react-icons/md";

import { toast } from "sonner";
import WaveSurfer from "wavesurfer.js";
import { useSocket } from "@/context/SocketContext";

function CaptureAudio({ hide, onSend }) {
  const socket = useSocket();
  // State for recording
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState(null);
  const [waveForm, setWaveForm] = useState(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [currentPlayBackTime, setCurrentPlayBackTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState(null);
  const [renderAudio, setRenderAudio] = useState(null);

  // Refs
  const audioRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const waveFormRef = useRef(null);
  const audioChunksRef = useRef([]);

  const {
    selectedChatType,
    selectedChatData,
    userInfo,
    setIsUploading,
    setFileUploadProgress,
  } = useAppStore();

  // Centralized function for sending messages through socket
  const sendSocketMessage = (messageType, content, fileUrl, voiceUrl) => {
    if (!socket) {
      console.error("Socket connection not established");
      toast.error("قد تكون متصل بالإنترنت بشكل ضعيف");
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

  // Update recording duration
  useEffect(() => {
    let interval;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingDuration((prevDuration) => {
          const newDuration = prevDuration + 1;
          setTotalDuration(newDuration);
          return newDuration;
        });
      }, 1000);
    }
    return () => {
      clearInterval(interval);
    };
  }, [isRecording]);

  // Initialize WaveSurfer
  useEffect(() => {
    const wavesurfer = WaveSurfer.create({
      container: waveFormRef.current,
      waveColor: "#ccc",
      progressColor: "#4a9eff",
      cursorColor: "#7ae3c3",
      barWidth: 2,
      height: 30,
      responsive: true,
    });
    setWaveForm(wavesurfer);

    wavesurfer.on("finish", () => {
      setIsPlaying(false);
    });

    return () => {
      wavesurfer.destroy();
    };
  }, []);

  // Track audio playback time
  useEffect(() => {
    if (recordedAudio) {
      const updatePlaybackTime = () => {
        setCurrentPlayBackTime(recordedAudio.currentTime);
      };
      recordedAudio.addEventListener("timeupdate", updatePlaybackTime);
      return () => {
        recordedAudio.removeEventListener("timeupdate", updatePlaybackTime);
      };
    }
  }, [recordedAudio]);

  const handlePlayRecording = () => {
    if (recordedAudio) {
      waveForm.stop();
      waveForm.play();
      recordedAudio.play();
      setIsPlaying(true);
    }
  };

  const handlePauseRecording = () => {
    if (recordedAudio && isPlaying) {
      waveForm.stop();
      recordedAudio.pause();
      setIsPlaying(false);
    }
  };

  const handleStartRecording = () => {
    setError(null);
    setRecordingDuration(0);
    setCurrentPlayBackTime(0);
    setTotalDuration(0);
    setIsRecording(true);
    audioChunksRef.current = [];

    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioRef.current.srcObject = stream;

        mediaRecorder.ondataavailable = (e) => {
          audioChunksRef.current.push(e.data);
        };

        mediaRecorder.onstop = () => {
          const blob = new Blob(audioChunksRef.current, { type: "audio/mp3" });
          const audioURL = URL.createObjectURL(blob);
          const audio = new Audio(audioURL);
          setRecordedAudio(audio);

          if (waveForm) {
            waveForm.load(audioURL);
          }
        };

        mediaRecorder.start();
      })
      .catch((error) => {
        console.error(`Error accessing microphone: ${error}`);
        setError("Could not access microphone. Please check permissions.");
        setIsRecording(false);
      });
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      // Stop all tracks to properly release the microphone
      if (audioRef.current && audioRef.current.srcObject) {
        audioRef.current.srcObject.getTracks().forEach((track) => track.stop());
      }

      // إضافة هذا الكود
      setTimeout(() => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/mp3",
        });
        // تحويل Blob إلى File
        const file = new File([audioBlob], `voice-${Date.now()}.mp3`, {
          type: "audio/mp3",
        });
        setRenderAudio(file);
      }, 300);
    }
  };

  const sendRecording = async () => {
    try {
      if (!renderAudio) {
        toast.error("No audio recorded");
        return;
      }
      setIsUploading(true);

      const dataForm = new FormData();
      dataForm.append("file", renderAudio); // Changed from "audio" to "file" to match server expectation

      const response = await apiClient.post(UPLOAD_VOICE_ROUTE, dataForm, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        params: {
          from: userInfo.id,
        },
        withCredentials: true,
        onUploadProgress: (data) =>
          setFileUploadProgress(Math.round(100 * data.loaded) / data.total),
      });

      if (response.status === 200 && response.data) {
        setIsUploading(false);
        sendSocketMessage(
          "voice",
          undefined,
          undefined,
          response.data.filePath
        );
      }
    } catch (error) {
      setIsUploading(false);
      console.error("Error sending audio:", error);
    } finally {
      setRenderAudio(null);
    }
  };

  const formatTime = (time) => {
    if (isNaN(time)) return "00:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col w-full items-center">
      <div className="flex w-full justify-end items-center">
        <div className="pt-1">
          <FaTrash
            className="text-panel-header-icon cursor-pointer"
            onClick={() => hide()}
          />
        </div>
        <div className="mx-2 sm:mx-4 py-2 px-3 sm:px-4 text-white text-base sm:text-lg flex gap-2 sm:gap-3 justify-center items-center bg-[#2A2B33] rounded-full drop-shadow-lg w-full max-w-xs sm:max-w-md">
          {error && (
            <div className="text-red-500 text-sm truncate max-w-full">
              {error}
            </div>
          )}

          {isRecording ? (
            <div className="text-red-500 animate-pulse text-center text-sm sm:text-base truncate flex-1">
              Recording <span className="ml-1">{recordingDuration}s</span>
            </div>
          ) : (
            <div className="flex items-center">
              {recordedAudio && (
                <>
                  {!isPlaying ? (
                    <FaPlay
                      className="cursor-pointer text-base sm:text-lg"
                      onClick={handlePlayRecording}
                    />
                  ) : (
                    <FaPauseCircle
                      className="cursor-pointer text-base sm:text-lg"
                      onClick={handlePauseRecording}
                    />
                  )}
                </>
              )}
            </div>
          )}

          <div
            className="flex-1 max-w-32 sm:max-w-40"
            ref={waveFormRef}
            hidden={isRecording}
          />

          {recordedAudio && isPlaying && (
            <span className="text-xs sm:text-sm whitespace-nowrap">
              {formatTime(currentPlayBackTime)}
            </span>
          )}
          {recordedAudio && !isPlaying && (
            <span className="text-xs sm:text-sm whitespace-nowrap">
              {formatTime(totalDuration)}
            </span>
          )}

          <audio ref={audioRef} hidden />

          <div>
            {!isRecording ? (
              <FaMicrophone
                className="text-red-500 cursor-pointer text-base sm:text-lg"
                onClick={handleStartRecording}
              />
            ) : (
              <FaStop
                className="text-red-500 cursor-pointer text-base sm:text-lg"
                onClick={handleStopRecording}
              />
            )}
          </div>

          <div>
            <MdSend
              className={`text-panel-header-icon cursor-pointer text-base sm:text-lg ${
                !recordedAudio ? "opacity-50" : ""
              }`}
              title="send"
              onClick={recordedAudio ? sendRecording : undefined}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default CaptureAudio;
