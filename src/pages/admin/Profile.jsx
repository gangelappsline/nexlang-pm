import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  HiUser,
  HiCamera,
  HiLockClosed,
  HiEye,
  HiEyeOff,
} from "react-icons/hi";
import apiClient from "../services/apiClient";
import DashboardLayout from "../layouts/DashboardLayout";
import { adminMenuItems } from "../config/roleMenus";
import { clientMenuItems } from "../config/roleMenus";
import { translatorMenuItems } from "../config/roleMenus";
import { proofreaderMenuItems } from "../config/roleMenus";
import { affiliateMenuItems } from "../config/roleMenus";

const ProfilePage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Get user info from localStorage
  const userString = localStorage.getItem("translation_user_data");
  const user = userString
    ? JSON.parse(userString)
    : { name: "User", email: "", role: "Member" };

  // Get menu items based on user role
  const getMenuItems = () => {
    const role = user.role?.toLowerCase();
    switch (role) {
      case "admin":
      case "administrator":
        return adminMenuItems;
      case "client":
        return clientMenuItems;
      case "translator":
        return translatorMenuItems;
      case "proofreader":
        return proofreaderMenuItems;
      case "affiliate":
        return affiliateMenuItems;
      default:
        return [];
    }
  };

  const [profileData, setProfileData] = useState({
    name: user.name || "",
    email: user.email || "",
    phone: user.phone || "",
    photo: user.photo || null,
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [previewImage, setPreviewImage] = useState(user.photo || null);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        setMessage({ type: "error", text: "Please select a valid image file" });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setMessage({ type: "error", text: "Image size must be less than 5MB" });
        return;
      }

      setMessage({ type: "", text: "" });

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);

      const formData = new FormData();
      formData.append("photo", file);

      try {
        setIsUploadingPhoto(true);
        const response = await apiClient.post("/auth/photo", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        const responseUser = response?.data?.user || response?.user;
        const photoUrl =
          responseUser?.photo ||
          response?.data?.photo ||
          response?.data?.photo ||
          response?.data?.photo_url ||
          response?.data?.url;

        if (responseUser && typeof responseUser === "object") {
          const updatedUser = {
            ...user,
            ...responseUser,
            photo: photoUrl ?? responseUser.photo ?? user.photo,
          };
          localStorage.setItem("translation_user_data", JSON.stringify(updatedUser));
          setProfileData((prev) => ({
            ...prev,
            photo: updatedUser.photo || prev.photo,
            photoFile: null,
          }));
          if (updatedUser.photo) {
            setPreviewImage(updatedUser.photo);
          }
        } else if (photoUrl) {
          const updatedUser = { ...user, photo: photoUrl };
          localStorage.setItem("translation_user_data", JSON.stringify(updatedUser));
          setProfileData((prev) => ({
            ...prev,
            photo: photoUrl,
            photoFile: null,
          }));
          setPreviewImage(photoUrl);
        }

        setMessage({ type: "success", text: "Profile photo updated successfully!" });
      } catch (error) {
        console.error("Error updating profile photo:", error);
        setMessage({
          type: "error",
          text:
            error.response?.data?.message ||
            "Failed to update profile photo. Please try again.",
        });
      } finally {
        setIsUploadingPhoto(false);
      }
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const formData = new FormData();
      formData.append("name", profileData.name);
      formData.append("email", profileData.email);
      formData.append("phone", profileData.phone);

      if (profileData.photoFile) {
        formData.append("photo", profileData.photoFile);
      }

      const response = await apiClient.put("/user/profile", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // Update localStorage with new user data
      const updatedUser = { ...user, ...response.data };
      localStorage.setItem("translation_user_data", JSON.stringify(updatedUser));

      setMessage({ type: "success", text: "Profile updated successfully!" });

      // Reload page after 1.5 seconds to reflect changes
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error("Error updating profile:", error);
      setMessage({
        type: "error",
        text:
          error.response?.data?.message ||
          "Failed to update profile. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    // Validate passwords
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: "error", text: "New passwords do not match" });
      setLoading(false);
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setMessage({
        type: "error",
        text: "Password must be at least 8 characters long",
      });
      setLoading(false);
      return;
    }

    try {
      await apiClient.put("/user/change-password", {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      setMessage({ type: "success", text: "Password changed successfully!" });
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      localStorage.removeItem("translation_user_token");
      localStorage.removeItem("translation_user_data");
      localStorage.removeItem("auth_token");
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      setTimeout(() => {
        navigate("/login");
      }, 800);
    } catch (error) {
      console.error("Error changing password:", error);
      setMessage({
        type: "error",
        text:
          error.response?.data?.message ||
          "Failed to change password. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout menuItems={getMenuItems()} userInfo={user}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-600 mt-1">
            Manage your account settings and preferences
          </p>
        </div>

        {/* Message Alert */}
        {message.text && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === "success"
                ? "bg-green-50 text-green-800 border border-green-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => setActiveTab("profile")}
                className={`flex items-center gap-2 px-6 py-4 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === "profile"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <HiUser className="w-5 h-5" />
                Profile Information
              </button>
              <button
                onClick={() => setActiveTab("password")}
                className={`flex items-center gap-2 px-6 py-4 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === "password"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <HiLockClosed className="w-5 h-5" />
                Change Password
              </button>
            </div>
          </div>

          {/* Profile Tab */}
          {activeTab === "profile" && (
            <form onSubmit={handleProfileSubmit} className="p-6 md:p-8">
              <div className="space-y-6">
                {/* photo Upload */}
                <div className="flex flex-col items-center pb-6 border-b border-gray-200">
                  <div className="relative">
                    <div className="w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center relative">
                      {previewImage ? (
                        <img
                          src={previewImage}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-white text-4xl font-bold">
                          {profileData.name?.charAt(0).toUpperCase() || "U"}
                        </span>
                      )}
                      {isUploadingPhoto && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      )}
                    </div>
                    <label className={`absolute bottom-0 right-0 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-700 transition-colors shadow-lg ${
                      isUploadingPhoto ? "opacity-60 pointer-events-none" : ""
                    }`}>
                      <HiCamera className="w-5 h-5 text-white" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                  {isUploadingPhoto && (
                    <p className="text-xs text-blue-600 mt-2 flex items-center gap-2">
                      <span className="inline-block w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></span>
                      Updating photo...
                    </p>
                  )}
                  <p className="text-sm text-gray-500 mt-3">
                    Click the camera icon to upload a new photo
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    JPG, PNG or GIF (max 5MB)
                  </p>
                </div>

                {/* Name */}
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={profileData.name}
                    onChange={handleProfileChange}
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={profileData.email}
                    onChange={handleProfileChange}
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label
                    htmlFor="phone"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={profileData.phone}
                    onChange={handleProfileChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Role (Read-only) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <input
                    type="text"
                    value={user.role || "Member"}
                    disabled
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                  />
                </div>

                {/* Submit Button */}
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full md:w-auto px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Password Tab */}
          {activeTab === "password" && (
            <form onSubmit={handlePasswordSubmit} className="p-6 md:p-8">
              <div className="space-y-6">
                {/* Current Password */}
                <div>
                  <label
                    htmlFor="currentPassword"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      id="currentPassword"
                      name="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      required
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowCurrentPassword(!showCurrentPassword)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showCurrentPassword ? (
                        <HiEyeOff className="w-5 h-5" />
                      ) : (
                        <HiEye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label
                    htmlFor="newPassword"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      id="newPassword"
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      required
                      minLength={8}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showNewPassword ? (
                        <HiEyeOff className="w-5 h-5" />
                      ) : (
                        <HiEye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Must be at least 8 characters long
                  </p>
                </div>

                {/* Confirm Password */}
                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      id="confirmPassword"
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      required
                      minLength={8}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? (
                        <HiEyeOff className="w-5 h-5" />
                      ) : (
                        <HiEye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full md:w-auto px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Changing..." : "Change Password"}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ProfilePage;
