import { useAppStore } from "@/store";
import { HOST } from "@/utils/constansts";
import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";

const SocketContext = createContext(null);

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
  const { userInfo } = useAppStore();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (userInfo) {
      const newSocket = io(HOST, {
        withCredentials: true,
        query: { userId: userInfo.id },
      });

      newSocket.on("connect", () => {
        console.log("connected to socket server");
      });

      const handleReceiveMessage = (message) => {
        const {
          selectedChatData,
          selectedChatType,
          addMessage,
          addContactsInDMContacts,
        } = useAppStore.getState();

        if (
          selectedChatType !== undefined &&
          (selectedChatData._id === message.sender._id ||
            selectedChatData._id === message.recipient._id)
        ) {
          console.log("message rcv", message);
          addMessage(message);
        }
        addContactsInDMContacts(message);
      };

      const handleReceiveChannelMessage = (message) => {
        const {
          selectedChatData,
          selectedChatType,
          addMessage,
          addChannelMessageInChannelList,
        } = useAppStore.getState();

        if (
          selectedChatType !== undefined &&
          selectedChatData._id === message.channelId
        ) {
          addMessage(message);
        }
        addChannelMessageInChannelList(message);
      };

      newSocket.on("recieveMessage", handleReceiveMessage);
      newSocket.on("recieve-channel-message", handleReceiveChannelMessage);

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    }
  }, [userInfo]);

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};
