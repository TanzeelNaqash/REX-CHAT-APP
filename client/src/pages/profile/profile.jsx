import { useAppStore } from "@/store";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { IoArrowBack } from "react-icons/io5";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { colors, getColor } from "@/lib/utils";
import { FaTrash, FaPlus } from "react-icons/fa";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import {
  ADD_PROFILE_IMAGE_ROUTE,
  HOST,
  REMOVE_PROFILE_IMAGE_ROUTE,
  UPDATE_PROFILE_ROUTE,
} from "@/utils/constants";

const Profile = () => {
  const { userInfo, setUserInfo } = useAppStore();
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [image, setImage] = useState(null);
  const [hovered, setHovered] = useState(false);
  const [selectedColor, setSelectedColor] = useState(0);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (userInfo.profileSetup) {
      setFirstName(userInfo.firstName);
      setLastName(userInfo.lastName);
      setSelectedColor(userInfo.color);
    }
    if (userInfo.image) {
      setImage(`${HOST}/${userInfo.image}`);
    }
  }, [userInfo]);

  const validateProfile = () => {
    if (!firstName) {
      toast.error("First Name is Required!");
      return false;
    }
    if (!lastName) {
      toast.error("Last Name is Required!");
      return false;
    }
    return true;
  };

  const saveChanges = async () => {
    if (validateProfile()) {
      try {
        const response = await apiClient.post(
          UPDATE_PROFILE_ROUTE,
          { firstName, lastName, color: selectedColor },
          { withCredentials: true }
        );
        if (response.status === 200 && response.data) {
          setUserInfo({ ...response.data });
          toast.success("Profile Updated Successfully!");
          navigate("/chat");
        }
      } catch (error) {
        console.log(error);
      }
    }
  };

  const handleNavigate = () => {
    if (userInfo.profileSetup) {
      navigate("/chat");
    } else {
      toast.error("Please Setup Your Profile First!");
    }
  };

  const handleFileInputRef = () => {
    fileInputRef.current.click();
  };

  const handleImageChange = async (event) => {
    const file = event.target.files[0];
    if (file) {
      const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB
      
      if (file.size > MAX_FILE_SIZE) {
        toast.error("File too large. Please choose a file under 15MB.");
        return;
      }

      // Check file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
      if (!allowedTypes.includes(file.type)) {
        toast.error("Invalid file type. Only JPEG, PNG, WebP and SVG files are allowed.");
        return;
      }

      try {
        const formData = new FormData();
        formData.append("profile-image", file);
        
        const response = await apiClient.post(
          ADD_PROFILE_IMAGE_ROUTE,
          formData,
          { 
            withCredentials: true,
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          }
        );

        if (response.status === 200 && response.data.image) {
          setUserInfo({ ...userInfo, image: response.data.image });
          setImage(`${HOST}/${response.data.image}`);
          toast.success("Profile Pic has been Updated!");
        }
      } catch (error) {
        console.error("Profile image upload error:", error);
        if (error.response?.data?.message) {
          toast.error(error.response.data.message);
        } else {
          toast.error("Failed to upload profile image. Please try again.");
        }
      }
    }
  };

  const handleDeleteImage = async () => {
    try {
      const response = await apiClient.delete(REMOVE_PROFILE_IMAGE_ROUTE, {
        withCredentials: true,
      });
      if (response.status === 200) {
        setUserInfo({ ...userInfo, image: null });
        toast.success("Profile Image Removed!");
        setImage(null);
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="bg-[#1b1c24] min-h-screen flex flex-col items-center px-4 py-10 md:py-16">
      {/* Back Button */}
      <div className="w-full max-w-md">
        <IoArrowBack
          className="text-3xl md:text-4xl text-white cursor-pointer"
          onClick={handleNavigate}
        />
      </div>

      {/* Profile Section */}
      <div className="flex flex-col items-center w-full max-w-md mt-6 md:mt-10 space-y-6">
        {/* Avatar */}
        <div
          className="relative w-28 h-28 md:w-40 md:h-40 uppercase rounded-full overflow-hidden"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          <Avatar className="w-full h-full">
            {image ? (
              <AvatarImage
                src={image}
                alt="profile"
                className="object-cover w-full h-full"
              />
            ) : (
              <div
                className={`flex items-center justify-center text-3xl md:text-4xl font-bold w-full h-full rounded-full ${getColor(selectedColor)}`}
              >
                {firstName ? firstName[0] : userInfo.email[0]}
              </div>
            )}
          </Avatar>
          {hovered && (
            <div
              className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full cursor-pointer"
              onClick={image ? handleDeleteImage : handleFileInputRef}
            >
              {image ? (
                <FaTrash className="text-white text-2xl md:text-3xl" />
              ) : (
                <FaPlus className="text-white text-2xl md:text-3xl" />
              )}
            </div>
          )}
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={handleImageChange}
            accept=".png, .jpg, .jpeg, .svg, .webp"
          />
        </div>

        {/* Input Fields */}
        <div className="w-full space-y-4 text-white">
          <Input
            placeholder="Email"
            type="email"
            disabled
            value={userInfo.email}
            className="rounded-lg p-4 bg-[#2c2e3b] border-none w-full"
          />
          <Input
            placeholder="First Name"
            type="text"
            onChange={(e) => setFirstName(e.target.value)}
            value={firstName}
            className="rounded-lg p-4 bg-[#2c2e3b] border-none w-full"
          />
          <Input
            placeholder="Last Name"
            type="text"
            onChange={(e) => setLastName(e.target.value)}
            value={lastName}
            className="rounded-lg p-4 bg-[#2c2e3b] border-none w-full"
          />
        </div>

        {/* Color Selection */}
        <div className="flex gap-3 flex-wrap justify-center w-full">
          {colors.map((color, index) => (
            <div
              key={index}
              className={`${color} h-8 w-8 rounded-full cursor-pointer transition-all duration-300 ${
                selectedColor === index ? "outline outline-white/50" : ""
              }`}
              onClick={() => setSelectedColor(index)}
            ></div>
          ))}
        </div>

        {/* Save Button */}
        <Button
          className="h-12 w-full bg-purple-500 hover:bg-purple-700 transition-all duration-300 rounded-lg text-white"
          onClick={saveChanges}
        >
          Save Changes
        </Button>
      </div>
    </div>
  );
};

export default Profile;
