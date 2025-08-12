import React, { useState, useEffect } from "react";
import { useUserStore } from "../store/useUserStore";
import axios from "../lib/axios";
import { toast } from "react-hot-toast";
import EmergencyCallPopup from "./EmergencyCallPopup";

const EmergencyCallNotifier = () => {
  const { user } = useUserStore();
  const [currentCall, setCurrentCall] = useState(null);
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    if (!user) return;

    // Request notification permission
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }

    // Check for ringing calls immediately
    checkForRingingCalls();

    // Check every 1 second for immediate response
    const interval = setInterval(checkForRingingCalls, 1000);

    return () => clearInterval(interval);
  }, [user]);

  const checkForRingingCalls = async () => {
    try {
      const response = await axios.get("/emergency-calls/active");
      const calls = response.data.data || [];

      // Find calls where current user is being rung
      const ringingCalls = calls.filter(call => 
        call.status === "ringing" &&
        call.donorResponses?.some(dr => 
          dr.donorId === user._id && dr.status === "ringing"
        )
      );

      // Also check for connected calls where user hasn't responded yet
      const connectedCalls = calls.filter(call => 
        call.status === "connected" &&
        call.donorResponses?.some(dr => 
          dr.donorId === user._id && dr.status === "ringing"
        )
      );

      const allActiveCalls = [...ringingCalls, ...connectedCalls];

      if (allActiveCalls.length > 0 && !showPopup) {
        console.log("🚨 RINGING CALL DETECTED:", allActiveCalls[0]);
        
        // Vibrate on mobile devices (only if user has interacted)
        if (navigator.vibrate && document.hasFocus()) {
          try {
            navigator.vibrate([200, 100, 200, 100, 200]);
          } catch (error) {
            console.log("Vibration not supported or blocked");
          }
        }
        
        // Show browser notification
        if (Notification.permission === "granted") {
          new Notification("🚨 Emergency Blood Call", {
            body: `${allActiveCalls[0].requester.name} needs ${allActiveCalls[0].bloodRequest.bloodType} blood urgently!`,
            icon: "/favicon.ico",
            requireInteraction: true,
            vibrate: [200, 100, 200, 100, 200]
          });
        }
        
        setCurrentCall(allActiveCalls[0]);
        setShowPopup(true);
      } else if (allActiveCalls.length === 0 && showPopup) {
        // If no active calls and popup is showing, close it
        setShowPopup(false);
        setCurrentCall(null);
      }
    } catch (error) {
      console.error("Error checking for ringing calls:", error);
    }
  };

  const handleAccept = async (callData) => {
    setShowPopup(false);
    setCurrentCall(null);
    
    // Show contact details in a modal
    if (callData.requesterContact) {
      showContactDetailsModal(callData.requesterContact, callData.bloodRequest);
    }
    
    // Show success message
    toast.success("Call accepted! Contact details shared successfully.");
  };

  const showContactDetailsModal = (requesterContact, bloodRequest) => {
    // Create a modal to show contact details
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50';
    modal.innerHTML = `
      <div class="bg-white rounded-3xl p-8 max-w-md w-full text-center">
        <div class="mb-6">
          <div class="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h2 class="text-2xl font-bold text-green-600 mb-2">Call Accepted!</h2>
          <p class="text-gray-600">Contact details shared successfully</p>
        </div>
        
        <div class="bg-green-50 rounded-2xl p-6 mb-6 border border-green-200">
          <h3 class="font-bold text-lg text-gray-800 mb-4">Requester Contact Details</h3>
          <div class="space-y-3 text-left">
            <div class="flex items-center bg-white rounded-lg p-3">
              <svg class="h-5 w-5 text-gray-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
              </svg>
              <span class="font-medium">${requesterContact.name}</span>
            </div>
            <div class="flex items-center bg-white rounded-lg p-3">
              <svg class="h-5 w-5 text-blue-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
              </svg>
              <span class="font-medium">${requesterContact.phone}</span>
            </div>
            <div class="flex items-center bg-white rounded-lg p-3">
              <svg class="h-5 w-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
              </svg>
              <span class="font-medium">${requesterContact.email || "Not provided"}</span>
            </div>
          </div>
        </div>
        
        <div class="bg-blue-50 rounded-2xl p-6 mb-6 border border-blue-200">
          <h3 class="font-bold text-lg text-gray-800 mb-4">Blood Request Details</h3>
          <div class="space-y-2 text-left">
            <div class="flex items-center bg-white rounded-lg p-3">
              <svg class="h-5 w-5 text-red-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
              </svg>
              <span class="font-medium">Blood Type: <span class="text-red-600 font-bold">${bloodRequest.bloodType}</span></span>
            </div>
            <div class="flex items-center bg-white rounded-lg p-3">
              <svg class="h-5 w-5 text-orange-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <span class="font-medium">Units Needed: <span class="text-orange-600 font-bold">${bloodRequest.units}</span></span>
            </div>
            <div class="flex items-center bg-white rounded-lg p-3">
              <svg class="h-5 w-5 text-purple-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
              </svg>
              <span class="font-medium">Urgency: <span class="text-purple-600 font-bold">${bloodRequest.urgency}</span></span>
            </div>
          </div>
        </div>
        
        <div class="flex space-x-4">
          <button onclick="this.closest('.fixed').remove()" class="flex-1 bg-gray-300 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-400 font-semibold">
            Close
          </button>
          <button onclick="window.open('tel:${requesterContact.phone}', '_self')" class="flex-1 bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 font-semibold">
            Call Now
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Auto-remove modal after 10 seconds
    setTimeout(() => {
      if (modal.parentNode) {
        modal.remove();
      }
    }, 10000);
  };

  const handleReject = () => {
    setShowPopup(false);
    setCurrentCall(null);
  };

  if (!showPopup || !currentCall) {
    return null;
  }

  return (
    <EmergencyCallPopup
      call={currentCall}
      onAccept={handleAccept}
      onReject={handleReject}
      onClose={() => setShowPopup(false)}
    />
  );
};

export default EmergencyCallNotifier; 