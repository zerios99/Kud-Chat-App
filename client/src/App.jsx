import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Auth from "./pages/auth";
import Chat from "./pages/chat";
import Profile from "./pages/profile";
import { useEffect, useState } from "react";
import { useAppStore } from "@/store";
import { apiClient } from "./lib/api-client";
import { GET_USER_INFO } from "./utils/constansts";
import PropTypes from "prop-types";

const PrivateRoute = ({ children }) => {
  const { userInfo } = useAppStore();
  const isAuthenticated = !!userInfo;
  return isAuthenticated ? children : <Navigate to="/auth" />;
};

PrivateRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

const AuthRoute = ({ children }) => {
  const { userInfo } = useAppStore();
  const isAuthenticated = !!userInfo;
  return isAuthenticated ? <Navigate to="/chat" /> : children;
};

AuthRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

function App() {
  const { userInfo, setUserInfo } = useAppStore();
  const [loading, setloading] = useState(true);

  useEffect(() => {
    const getUserData = async () => {
      try {
        const response = await apiClient.get(GET_USER_INFO, {
          withCredentials: true,
        });
        if (response.status === 200 && response.data.id) {
          setUserInfo(response.data);
        } else {
          setUserInfo(undefined);
        }
        console.log({ response });
      } catch (error) {
        setUserInfo(undefined);
        console.log({ error });
      } finally {
        setloading(false);
      }
    };
    if (!userInfo) {
      getUserData();
    } else {
      setloading(false);
    }
  }, [userInfo, setUserInfo]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[100vh] bg-[#1C1D25]">
        <div className="relative w-10 h-10">
          <div className="absolute inset-0 border-4 border-transparent border-t-purple-600 border-r-purple-600 rounded-full animate-spin"></div>
          <div className="absolute inset-0 border-4 border-transparent border-b-purple-400 border-l-purple-400 rounded-full animate-spin-reverse"></div>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/auth"
          element={
            <AuthRoute>
              {" "}
              <Auth />{" "}
            </AuthRoute>
          }
        />
        <Route
          path="/chat"
          element={
            <PrivateRoute>
              {" "}
              <Chat />{" "}
            </PrivateRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              {" "}
              <Profile />{" "}
            </PrivateRoute>
          }
        />
        <Route path="*" element={<Navigate to="/auth" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
