import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Swal from 'sweetalert2';
import {
  HiX,
  HiCamera,
  HiLockClosed,
  HiEye,
  HiEyeOff,
  HiUser,
} from "react-icons/hi";
import apiClient from "../services/apiClient";

const ProfileModal = ({ isOpen, onClose, user: initialUser }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const [user, setUser] = useState(initialUser);

  useEffect(() => {
    if (isOpen && initialUser) {
      setUser(initialUser);
      setProfileData({
        name: initialUser.name || "",
        email: initialUser.email || "",
        phone: initialUser.phone || "",
        photo: initialUser.photo || null,
      });
      setPreviewImage(initialUser.photo || null);
    }
  }, [isOpen, initialUser]);

  const [profileData, setProfileData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    photo: user?.photo || null,
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [previewImage, setPreviewImage] = useState(user?.photo || null);

  if (!isOpen) return null;

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
        await Swal.fire({
          title: 'Invalid File',
          text: 'Please select a valid image file',
          icon: 'error',
          confirmButtonColor: '#3b82f6'
        });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        await Swal.fire({
          title: 'File Too Large',
          text: 'Image size must be less than 5MB',
          icon: 'error',
          confirmButtonColor: '#3b82f6'
        });
        return;
      }

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
          response?.data?.photo_url ||
          response?.data?.url;

        if (responseUser && typeof responseUser === "object") {
          const updatedUser = {
            ...user,
            ...responseUser,
            photo: photoUrl ?? responseUser.photo ?? user.photo,
          };
          localStorage.setItem("translation_user_data", JSON.stringify(updatedUser));
          setUser(updatedUser);
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
          setUser(updatedUser);
          setProfileData((prev) => ({
            ...prev,
            photo: photoUrl,
            photoFile: null,
          }));
          setPreviewImage(photoUrl);
        }

        await Swal.fire({
          title: 'Success',
          text: 'Profile photo updated successfully!',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
      } catch (error) {
        console.error("Error updating profile photo:", error);
        await Swal.fire({
          title: 'Error',
          text: error.response?.data?.message || 'Failed to update profile photo. Please try again.',
          icon: 'error',
          confirmButtonColor: '#3b82f6'
        });
      } finally {
        setIsUploadingPhoto(false);
      }
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

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
      setUser(updatedUser);

      await Swal.fire({
        title: 'Success',
        text: 'Profile updated successfully!',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });

      // Close modal and reload to reflect changes
      setTimeout(() => {
        onClose();
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error("Error updating profile:", error);
      await Swal.fire({
        title: 'Error',
        text: error.response?.data?.message || 'Failed to update profile. Please try again.',
        icon: 'error',
        confirmButtonColor: '#3b82f6'
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Validate passwords
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      await Swal.fire({
        title: 'Password Mismatch',
        text: 'New passwords do not match',
        icon: 'error',
        confirmButtonColor: '#3b82f6'
      });
      setLoading(false);
      return;
    }

    if (passwordData.newPassword.length < 8) {
      await Swal.fire({
        title: 'Password Too Short',
        text: 'Password must be at least 8 characters long',
        icon: 'error',
        confirmButtonColor: '#3b82f6'
      });
      setLoading(false);
      return;
    }

    try {
      await apiClient.put("/user/change-password", {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      await Swal.fire({
        title: 'Success',
        text: 'Password changed successfully! Please login again.',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });

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
        onClose();
        navigate("/login");
      }, 2000);
    } catch (error) {
      console.error("Error changing password:", error);
      await Swal.fire({
        title: 'Error',
        text: error.response?.data?.message || 'Failed to change password. Please try again.',
        icon: 'error',
        confirmButtonColor: '#3b82f6'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setActiveTab('profile');
    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-xl shadow-2xl m-4">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
          <h2 className="text-xl font-bold text-gray-900">My Profile</h2>
          <button
            onClick={handleClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <HiX className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 bg-gray-50">
          <div className="flex px-6">
            <button
              onClick={() => setActiveTab("profile")}
              className={`flex items-center gap-2 px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
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
              className={`flex items-center gap-2 px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
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
          <form onSubmit={handleProfileSubmit} className="p-6">
            <div className="space-y-6">
              {/* Photo Upload */}
              <div className="flex flex-col items-center pb-6 border-b border-gray-200">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center relative">
                    {previewImage ? (
                      <img
                        src={previewImage}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-white text-3xl font-bold">
                        {profileData.name?.charAt(0).toUpperCase() || "U"}
                      </span>
                    )}
                    {isUploadingPhoto && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                  </div>
                  <label
                    className={`absolute bottom-0 right-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-700 transition-colors shadow-lg ${
                      isUploadingPhoto ? "opacity-60 pointer-events-none" : ""
                    }`}
                  >
                    <HiCamera className="w-4 h-4 text-white" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                      disabled={isUploadingPhoto}
                    />
                  </label>
                </div>
                {isUploadingPhoto && (
                  <p className="text-xs text-blue-600 mt-2 flex items-center gap-2">
                    <span className="inline-block w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></span>
                    Updating photo...
                  </p>
                )}
                <p className="text-sm text-gray-500 mt-2">
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
                  value={user?.role || "Member"}
                  disabled
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Password Tab */}
        {activeTab === "password" && (
          <form onSubmit={handlePasswordSubmit} className="p-6">
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
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
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
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Changing..." : "Change Password"}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ProfileModal;
