import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../lib/axios";
import { toast } from "react-hot-toast";
import { PhoneIcon, UserIcon, ClockIcon } from "@heroicons/react/24/outline";

const BloodDonorCard = ({ donor }) => {
  const navigate = useNavigate();
  const { bloodType, fullName, available, profilePicture, _id } = donor;
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactForm, setContactForm] = useState({
    bloodType: "",
    units: 1,
    urgency: "routine",
    purpose: "emergency",
    requiredBy: "",
    hospital: "",
    patientName: "",
    patientAge: "",
    patientGender: "",
    relationship: "other"
  });

  const handleContactRequest = async (e) => {
    e.preventDefault();
    
    try {
      const response = await axios.post('/contact-requests/create', {
        donorId: _id,
        ...contactForm
      });

      toast.success('Contact request sent successfully! Donor will be notified.');
      setShowContactForm(false);
      setContactForm({
        bloodType: "",
        units: 1,
        urgency: "routine",
        purpose: "emergency",
        requiredBy: "",
        hospital: "",
        patientName: "",
        patientAge: "",
        patientGender: "",
        relationship: "other"
      });
    } catch (error) {
      console.error('Error sending contact request:', error);
      toast.error(error.response?.data?.error || 'Failed to send contact request');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 md:p-6 max-w-sm mx-auto">
      <div className="flex flex-col md:flex-row items-center border-b border-gray-200 pb-4 md:pb-6">
        <img
          src={profilePicture || "https://via.placeholder.com/150"}
          alt="profile picture"
          className="w-16 h-16 md:w-20 md:h-20 rounded-full mb-4 md:mb-0 md:mr-4"
        />
        <div className="flex-1 text-center md:text-left">
          <h2 className="text-xl md:text-2xl font-bold">{fullName}</h2>
          <p className="text-md md:text-lg text-gray-600">Blood Type: {bloodType}</p>
        </div>
      </div>
      
      <div className="mt-4 md:mt-6 text-center md:text-left">
        <div className="flex items-center justify-center md:justify-start mb-3">
          <UserIcon className="w-5 h-5 mr-2 text-gray-500" />
          <span className="text-md md:text-lg">
            <strong>Donor:</strong> {fullName}
          </span>
        </div>
        
        <div className="flex items-center justify-center md:justify-start mb-3">
          <ClockIcon className="w-5 h-5 mr-2 text-gray-500" />
          <span className="text-md md:text-lg">
            <strong>Status:</strong>
            <span className={`px-2 py-1 rounded-full ml-2 ${available ? "bg-green-200 text-green-800" : "bg-red-200 text-red-800"}`}>
              {available ? "Available" : "Not Available"}
            </span>
          </span>
        </div>

        <div className="text-center mt-4 space-y-2">
          {available ? (
            <>
              <button
                onClick={() => setShowContactForm(true)}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 flex items-center justify-center mx-auto w-full"
              >
                <PhoneIcon className="w-4 h-4 mr-2" />
                Request Contact
              </button>
              <button
                onClick={() => navigate('/emergency-calls')}
                className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 flex items-center justify-center mx-auto w-full text-sm"
              >
                🚨 Emergency Call
              </button>
            </>
          ) : (
            <button
              disabled
              className="bg-gray-400 text-white px-4 py-2 rounded-md cursor-not-allowed flex items-center justify-center mx-auto w-full"
            >
              <PhoneIcon className="w-4 h-4 mr-2" />
              Not Available
            </button>
          )}
        </div>
      </div>

      {/* Contact Request Modal */}
      {showContactForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Request Contact with {fullName}</h3>
            
            <form onSubmit={handleContactRequest} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Blood Type Needed *</label>
                <select
                  required
                  value={contactForm.bloodType}
                  onChange={(e) => setContactForm({...contactForm, bloodType: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="">Select Blood Type</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Units Needed *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={contactForm.units}
                    onChange={(e) => setContactForm({...contactForm, units: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Urgency *</label>
                  <select
                    required
                    value={contactForm.urgency}
                    onChange={(e) => setContactForm({...contactForm, urgency: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="routine">Routine</option>
                    <option value="urgent">Urgent</option>
                    <option value="emergency">Emergency</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Purpose *</label>
                <select
                  required
                  value={contactForm.purpose}
                  onChange={(e) => setContactForm({...contactForm, purpose: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="emergency">Emergency</option>
                  <option value="surgery">Surgery</option>
                  <option value="transfusion">Transfusion</option>
                  <option value="donation">Donation</option>
                  <option value="testing">Testing</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Required By</label>
                <input
                  type="datetime-local"
                  value={contactForm.requiredBy}
                  onChange={(e) => setContactForm({...contactForm, requiredBy: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hospital</label>
                <input
                  type="text"
                  value={contactForm.hospital}
                  onChange={(e) => setContactForm({...contactForm, hospital: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Patient Name</label>
                <input
                  type="text"
                  value={contactForm.patientName}
                  onChange={(e) => setContactForm({...contactForm, patientName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Patient Age</label>
                  <input
                    type="number"
                    min="0"
                    max="120"
                    value={contactForm.patientAge}
                    onChange={(e) => setContactForm({...contactForm, patientAge: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Patient Gender</label>
                  <select
                    value={contactForm.patientGender}
                    onChange={(e) => setContactForm({...contactForm, patientGender: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Your Relationship</label>
                <select
                  value={contactForm.relationship}
                  onChange={(e) => setContactForm({...contactForm, relationship: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="self">Self</option>
                  <option value="family">Family</option>
                  <option value="friend">Friend</option>
                  <option value="hospital">Hospital</option>
                  <option value="blood_bank">Blood Bank</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowContactForm(false)}
                  className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                >
                  Send Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BloodDonorCard;

