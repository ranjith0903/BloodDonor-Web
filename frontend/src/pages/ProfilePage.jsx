import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LogOut,
  Edit,
  Phone,
  Mail,
  Droplet,
  Camera,
  Trash,
  MapPin,
  Pencil,
} from "lucide-react";
import { useUserStore } from "../store/useUserStore";
import LoadingSpinner from "../components/LoadingSpinner";
import axios from "../lib/axios";


const Button = ({ children, onClick, className }) => (
  <button onClick={onClick} className={`px-4 py-2 rounded ${className}`}>
    {children}
  </button>
);

const Switch = ({ checked, onChange }) => (
  <div
    className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer ${checked ? "bg-red-500" : "bg-gray-300"}`}
    onClick={onChange}
  >
    <div
      className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ease-in-out ${checked ? "translate-x-5" : "translate-x-0"}`}
    />
  </div>
);

const ProfilePage = () => {
  const {logout,checkAuth}=useUserStore();
  const { user, getProfile, loading } = useUserStore();
  const [isAvailable, setIsAvailable] = useState(user?.available);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editField, setEditField] = useState("");
  const [newValue, setNewValue] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  
  const navigate = useNavigate();


 

  const handleDeleteAccount = async () => {
    try {
      const response = await axios.delete("/auth/profile/delete");
      checkAuth();
      navigate("/signup");
      
     
      // You may want to redirect the user after account deletion
    } catch (error) {
      console.error("Error deleting account:", error.response.data);
    }
  };

  const handleFieldChange = (field) => {
    setEditField(field);
    setNewValue(user[field] || "");
    setIsModalOpen(true);
  };

  const handleSaveChanges = async () => {
    if (editField === "profilePicture" && selectedFile) {
      const formData = new FormData();
      formData.append("profilePicture", selectedFile);

      try {
        const response = await axios.post("/auth/profile/upload", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
      
        getProfile(); // Refresh profile data
      } catch (error) {
        console.error("Error uploading profile picture:", error.response.data);
      }
    } else {
      try {
        const response = await axios.post("/auth/profile/update", {
          field: editField,
          value: newValue,
        });
      
        getProfile(); // Refresh profile data
      } catch (error) {
        console.error("Error updating profile:", error.response.data);
      }
    }
    setIsModalOpen(false);
  };

  const handleProfilePictureChange = (e) => {
    setSelectedFile(e.target.files[0]);
    setEditField("profilePicture");
    setNewValue(URL.createObjectURL(e.target.files[0])); // Show preview
    setIsModalOpen(true);
  };

  // Handle the availability toggle
  const handleAvailabilityChange = async (newAvailability) => {
    setIsAvailable(newAvailability);
    

    try {
      const response = await axios.put("/auth/update-availability", {
        available: newAvailability,
      });
      
      getProfile(); // Refresh profile data
    } catch (error) {
      console.error("Error updating availability:", error.response.data);
    }
  };

  useEffect(() => {
    getProfile();
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-100 via-pink-100 to-white p-4 sm:p-8">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-lg">
        <div className="md:flex">
          <div className="md:w-1/3 bg-gradient-to-b from-red-500 to-red-600 text-white p-6 rounded-lg">
            <div className="relative w-32 h-32 mx-auto rounded-full overflow-hidden border-4 border-white shadow-lg">
              <img
                src={user?.profilePicture}
                alt={user?.fullName}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                className="absolute bottom-0 right-0 bg-white text-red-600 p-1 rounded-full shadow-md"
                onClick={() => document.getElementById("fileInput").click()}
              >
                <Camera className="h-5 w-5" />
              </button>
              <input
                id="fileInput"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleProfilePictureChange}
              />
            </div>
            <h2 className="mt-4 text-2xl font-bold text-center">
              {user?.fullName}
            </h2>
          </div>

          <div className="p-6 md:w-2/3 space-y-6">
            <div className="flex items-center space-x-3">
              <Droplet className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-sm font-medium text-gray-500">Blood Group</p>
                <p className="text-2xl font-bold text-red-600">
                  {user?.bloodType}
                </p>
                <Pencil
                  className="h-5 w-5 text-gray-400 cursor-pointer"
                  onClick={() => handleFieldChange("bloodType")}
                />
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Mail className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-500">Email</p>
                <p className="text-lg">{user?.email}</p>
                <Pencil
                  className="h-5 w-5 text-gray-400 cursor-pointer"
                  onClick={() => handleFieldChange("email")}
                />
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Phone className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-500">Contact Number</p>
                <p className="text-lg">{user?.phoneNumber}</p>
                <Pencil
                  className="h-5 w-5 text-gray-400 cursor-pointer"
                  onClick={() => handleFieldChange("phoneNumber")}
                />
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <MapPin className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-500">Location</p>
                <p className="text-lg"></p>
                <Pencil
                  className="h-5 w-5 text-gray-400 cursor-pointer"
                  onClick={() => handleFieldChange("location")}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Available for Donation</p>
                <p className="text-xs text-gray-400 mt-1">
                  {isAvailable ? "✅ You are visible to people searching for donors" : "❌ You are not visible to people searching for donors"}
                </p>
              </div>
              <Switch checked={isAvailable} onChange={() => handleAvailabilityChange(!isAvailable)} />
            </div>

            <div className="flex justify-center space-x-4 mt-6">
              <Button
                className="bg-gray-300 text-black"
                onClick={logout}
              >
                Log Out
              </Button>
              <Button
                className="bg-red-600 text-white"
                onClick={handleDeleteAccount}
              >
                Delete Account
              </Button>
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
            <h3 className="text-xl font-bold mb-4">Edit {editField}</h3>

            {editField === "bloodType" ? (
              <select
                className="w-full p-2 border border-gray-300 rounded"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
              >
                <option value="">Select Blood Type</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
                <option value="Rh-null">Rh-null</option>
              </select>
            ) : editField === "profilePicture" ? (
              <img src={newValue} alt="Preview" className="mb-4 w-full" />
            ) : editField === "location" ? (
              <input
                type="text"
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="Enter Pincode"
                onChange={(e) => setNewValue(e.target.value)}
              />
            ) : (
              <input
                type="text"
                className="w-full p-2 border border-gray-300 rounded"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
              />
            )}

            <div className="mt-4 flex justify-end space-x-2">
              <Button
                className="bg-gray-300 text-black"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                className="bg-blue-500 text-white"
                onClick={handleSaveChanges}
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
