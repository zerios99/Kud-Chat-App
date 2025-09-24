import Background from "../../assets/login2.png";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Victory from "../../assets/logo-4.png";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import { SINGUP_ROUTE, LOGIN_ROUTE } from "@/utils/constansts";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "@/store";

function Auth() {
  const navigate = useNavigate();
  const { setUserInfo } = useAppStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [conformPassword, setConformPassword] = useState("");

  const validateLogin = () => {
    if (!email.length) {
      toast.error("Email is required");
      return false;
    }
    if (!password.length) {
      toast.error("Password is required");
      return false;
    }
    return true;
  };

  const validateSingup = () => {
    if (!email.length) {
      toast.error("Email is required");
      return false;
    }
    if (!password.length) {
      toast.error("Password is required");
      return false;
    }
    if (password !== conformPassword) {
      toast.error("Conform password does not match");
      return false;
    }
    return true;
  };

  const handlLogin = async () => {
    if (validateLogin()) {
      const response = await apiClient.post(
        LOGIN_ROUTE,
        { email, password },
        { withCredentials: true }
      );
      if (response.data.user.id) {
        setUserInfo(response.data.user);
        if (response.data.user.profileSetup) {
          navigate("/chat");
        } else {
          navigate("/profile");
        }
      }
      console.log({ response });
    }
  };

  const handlSignup = async () => {
    if (validateSingup()) {
      const response = await apiClient.post(
        SINGUP_ROUTE,
        { email, password },
        { withCredentials: true }
      );
      if (response.status === 201) {
        setUserInfo(response.data.user);
        navigate("/profile");
      }
      console.log({ response });
    }
  };

  return (
    <div className="h-[100vh] w-[100vw] flex items-center justify-center bg-[#2a2b33]">
      <div
        className="h-[90vh] bg-[#1c1d25] text-opacity-90 rounded-lg w-[80vw]
         md:w-[90vw] lg:w-[70vw] xl:w-[60vw] grid xl:grid-cols-2"
      >
        <div className="flex flex-col gap-5 items-center justify-center">
          <div className="flex items-center justify-center flex-col">
            <div className="flex items-center justify-center rounded-3xl p-2">
              <h1 className="text-4xl font-bold md:text-4xl text-white">
                Kud-chat
              </h1>
              <img
                src={Victory}
                alt="victory emoji"
                className="h-[90px] ml-5 rounded-full"
              />
            </div>
            <p className="font-medium text-center text-white">
              Fill in the Details to Get Started
            </p>
          </div>
          <div className="flex items-center justify-center w-full">
            <Tabs className="w-3/4" defaultValue="login">
              <TabsList className="bg-transparent rounded-none w-full">
                <TabsTrigger
                  value="login"
                  className="data-[state=active]:bg-transparent text-white text-opacity-90 border-b-2 rounded-none w-full
                 data-[state=active]:text-white
                   data-[state=active]:font-semibold
                 data-[state=active]:border-b-purple-500 p-3 transtion-all duration-300"
                >
                  login
                </TabsTrigger>
                <TabsTrigger
                  value="signup"
                  className="data-[state=active]:bg-transparent text-white text-opacity-90 border-b-2 rounded-none w-full
                 data-[state=active]:text-white
                   data-[state=active]:font-semibold
                 data-[state=active]:border-b-purple-500 p-3 transtion-all duration-300"
                >
                  Signup
                </TabsTrigger>
              </TabsList>
              <TabsContent className="flex flex-col gap-5 mt-10" value="login">
                <Input
                  placeholder="Email"
                  type="email"
                  className="rounded-full p-6 transtion-all duration-300"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Input
                  placeholder="Password"
                  type="password"
                  className="rounded-full p-6 transtion-all duration-300"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <Button
                  className="rounded-full p-6 hover:bg-purple-500"
                  onClick={handlLogin}
                >
                  Login
                </Button>
              </TabsContent>
              <TabsContent className="flex flex-col gap-5" value="signup">
                <Input
                  placeholder="Email"
                  type="email"
                  className="rounded-full p-6 transtion-all duration-300"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Input
                  placeholder="Password"
                  type="password"
                  className="rounded-full p-6 transtion-all duration-300"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <Input
                  placeholder="confirm Password"
                  type="password"
                  className="rounded-full p-6 transtion-all duration-300"
                  value={conformPassword}
                  onChange={(e) => setConformPassword(e.target.value)}
                />
                <Button
                  className="rounded-full p-6 hover:bg-purple-500"
                  onClick={handlSignup}
                >
                  Signup
                </Button>
              </TabsContent>
            </Tabs>
          </div>
        </div>
        <div className="hidden xl:flex justify-center items-center">
          <img src={Background} alt="Background login" className="h-[500px]" />
        </div>
      </div>
    </div>
  );
}

export default Auth;
