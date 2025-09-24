import { useAppStore } from "@/store";
import { useNavigate } from "react-router-dom";
import { IoArrowBack } from "react-icons/io5";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { useEffect, useRef, useState } from "react";
import { colors, getColor } from "@/lib/utils";
import { FaTrash, FaPlus } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import { ADD_PROFILE_IMAGE_ROUTE, HOST, REMOVE_PROFILE_IMAGE_ROUTE, UPDATE_PROFILE_ROUTE } from "@/utils/constansts";

function Profile() {
  const navigate = useNavigate();
  const { userInfo, setUserInfo } = useAppStore();
  const [firstName, setFirstName] = useState(userInfo?.firstName || "");
  const [lastName, setLastName] = useState(userInfo?.lastName || "");
  const [image, setImage] = useState(userInfo?.profileImage || null);
  const [hovered, setHovered] = useState(false);
  const [selectedColor, setSelectedColor] = useState(0);
  const fileInputRef = useRef(null);

  useEffect( () => {
    if (userInfo.profileSetup) {
      setFirstName(userInfo.firstName);
      setLastName(userInfo.lastName);
      setSelectedColor(userInfo.color);
    }
    if (userInfo.image) {
      setImage(`${HOST}/${userInfo.image}`)
    }
  }, [userInfo] )

  const validateProfile = () => {
    if (!firstName) {
      toast.error("First name is required");
      return false;
    }
    if (!lastName) {
      toast.error("Last name is required");
      return false;
    }
    return true;
  }

  const saveChanges = async () => {
    if (validateProfile()) {
      try {
        const response = await apiClient.post(UPDATE_PROFILE_ROUTE, {
          firstName,
          lastName,
          color: selectedColor
        },
        { withCredentials: true });

        if (response.status === 200 && response.data) {
          setUserInfo({...response.data});
          toast.success("Profile updated successfully");
          navigate("/chat");
        }

      } catch (error) {
        console.log({ error });
      }
    }
  }

  const handleNavigate = () => {
    if (userInfo.profileSetup) {
      navigate("/chat");
    } else {
      toast.error("Please complete your profile setup");
    }
  }

  const handleFileInputClick = () => {
    fileInputRef.current.click();
  }

  const handleImageChange = async (event) => {
    const file = event.target.files[0];
    console.log({ file });
    if (file) {
      const formData = new FormData()
      formData.append("profileImage", file)
      const response = await apiClient.post(ADD_PROFILE_IMAGE_ROUTE, formData,{ withCredentials: true });
      if (response.status === 200 && response.data.image) {
        setUserInfo({...userInfo, image: response.data.image})
        toast.success("Image uploaded successfully")
      }
      const reader = new FileReader();
      reader.onload = () => {
        console.log({ reader });
        setImage(reader.result)
      }
      reader.readAsDataURL(file)
  }
}

  const handleDeleteImage = async () => {
    try {
      const response = await apiClient.delete(REMOVE_PROFILE_IMAGE_ROUTE, { withCredentials: true });
      if (response.status === 200) {
        setUserInfo({...userInfo, image: null});
        toast.success("Image removed successfully");
        setImage(null)
      }
    }
    catch (error) {
      console.log({ error });
    }
  }

  return (
    <div className="min-h-screen bg-[#1b1c24] p-4 flex justify-center items-center">
      <div className="w-full max-w-4xl mx-auto space-y-6">
        <div onClick={handleNavigate} className="w-fit">
          <IoArrowBack 
            className="text-2xl sm:text-3xl md:text-4xl text-white/90 cursor-pointer" 
            onClick={() => navigate(-1)}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div 
            className={`relative flex items-center justify-center transition-all duration-300 ${
              hovered ? "opacity-80 scale-105" : ""
            }`}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
          >
            <Avatar className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-full overflow-hidden">
              <AvatarImage 
                src={image || userInfo?.profileImage}
                alt={firstName}
                className="object-cover w-full h-full bg-black"
              />
              <div className={`uppercase w-full h-full text-2xl sm:text-3xl md:text-4xl border flex items-center justify-center rounded-full ${getColor(selectedColor)}`}>
                {firstName? firstName.split("").shift():userInfo.email.split("").shift()}
              </div>
            </Avatar>
            {
              hovered && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full cursor-pointer"
                  onClick={image ? handleDeleteImage : handleFileInputClick}>
                  {
                    image ? <FaTrash className="text-white text-xl sm:text-2xl" /> : <FaPlus className="text-white text-xl sm:text-2xl" />
                  }
                </div>
              )
            }
            <input type="file" ref={fileInputRef} className="hidden" onChange={handleImageChange} name="profileImage" accept=".png, .jpg, .svg, .webp, .jpeg" />
          </div>
          <div className="flex flex-col gap-4 text-white">
            <input 
              placeholder="Email"
              type="email" 
              disabled
              value={userInfo.email} 
              className="w-full rounded-lg p-3 sm:p-4 bg-[#2c2e3b] border-none"
            />
            <input 
              placeholder="First Name"
              type="text" 
              onChange={(e) => setFirstName(e.target.value)}
              value={firstName} 
              className="w-full rounded-lg p-3 sm:p-4 bg-[#2c2e3b] border-none"
            />
            <input 
              placeholder="Last Name"
              type="text" 
              onChange={(e) => setLastName(e.target.value)}
              value={lastName} 
              className="w-full rounded-lg p-3 sm:p-4 bg-[#2c2e3b] border-none"
            />
            <div className="flex flex-wrap gap-3">
              {colors.map((color, index) => (
                <div 
                  className={`${color} h-6 w-6 sm:h-8 sm:w-8 rounded-full cursor-pointer transition-all duration-300
                    ${selectedColor === index ? "outline outline-white/50 outline-1" : ""}`} 
                  key={index}
                  onClick={() => setSelectedColor(index)}
                ></div>
              ))}
            </div>
          </div>
        </div>
        <Button 
          className="w-full py-3 sm:py-4 bg-purple-700 hover:bg-purple-900 transition-all duration-300 text-sm sm:text-base"
          onClick={saveChanges}
        >
          Save Changes
        </Button>
      </div>
    </div>
  );
}


export default Profile;