import React, { useState, useEffect } from "react";
import { Phone, PhoneOff, User, MapPin, Droplet, Clock } from "lucide-react";
import axios from "../lib/axios";
import { toast } from "react-hot-toast";

// Create ringing sound using Web Audio API
let audioContext = null;
let oscillator = null;
let gainNode = null;

const createRingingSound = () => {
  try {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    if (oscillator) {
      oscillator.stop();
    }
    
    oscillator = audioContext.createOscillator();
    gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Create a ringing pattern
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.5);
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 1.0);
    oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 1.5);
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.setValueAtTime(0, audioContext.currentTime + 0.5);
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime + 1.0);
    gainNode.gain.setValueAtTime(0, audioContext.currentTime + 1.5);
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 2.0);
    
    // Repeat the sound
    setTimeout(() => {
      if (audioContext && audioContext.state === 'running') {
        createRingingSound();
      }
    }, 2000);
    
  } catch (error) {
    console.log("Audio not supported:", error);
  }
};

const stopRingingSound = () => {
  if (oscillator) {
    oscillator.stop();
    oscillator = null;
  }
  if (gainNode) {
    gainNode.disconnect();
    gainNode = null;
  }
};

const EmergencyCallPopup = ({ call, onAccept, onReject, onClose }) => {
  const [isRinging, setIsRinging] = useState(true);
  const [timeLeft, setTimeLeft] = useState(30); // 30 second timeout

  useEffect(() => {
    // Start ringing sound immediately
    createRingingSound();
    
    // Ringing animation
    const ringInterval = setInterval(() => {
      setIsRinging(prev => !prev);
    }, 1000);

    // Countdown timer
    const countdownInterval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          stopRingingSound();
          // Use setTimeout to avoid setState during render
          setTimeout(() => {
            onReject(); // Auto reject if timeout
            onClose(); // Close the popup
          }, 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      stopRingingSound();
      clearInterval(ringInterval);
      clearInterval(countdownInterval);
    };
  }, [onReject]);

  const handleAccept = async () => {
    stopRingingSound();
    try {
      console.log("Accepting call:", call.callId);
      const response = await axios.post(`/emergency-calls/${call.callId}/respond`, {
        response: "accept"
      });

      console.log("Accept response:", response.data);
      if (response.data.success) {
        toast.success("Call accepted! Contact details shared.");
        onAccept(response.data.data);
        // Close the popup immediately after successful acceptance
        onClose();
      }
    } catch (error) {
      console.error("Error accepting call:", error);
      console.error("Error response:", error.response?.data);
      toast.error(error.response?.data?.error || "Failed to accept call");
    }
  };

  const handleReject = async () => {
    stopRingingSound();
    try {
      console.log("Rejecting call:", call.callId);
      await axios.post(`/emergency-calls/${call.callId}/respond`, {
        response: "reject"
      });
      toast.success("Call rejected");
      onReject();
      // Close the popup immediately after rejection
      onClose();
    } catch (error) {
      console.error("Error rejecting call:", error);
      console.error("Error response:", error.response?.data);
      toast.error(error.response?.data?.error || "Failed to reject call");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className={`bg-white rounded-3xl p-8 max-w-md w-full text-center transform transition-all duration-300 ${
        isRinging ? 'scale-105' : 'scale-100'
      }`}>
        
        {/* Ringing Animation */}
        <div className="mb-8">
          <div className={`w-24 h-24 mx-auto rounded-full bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-center mb-6 ${
            isRinging ? 'animate-pulse shadow-lg shadow-red-500/50' : ''
          }`}>
            <Phone className="h-12 w-12 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-red-600 mb-3">
            {isRinging ? "🚨 EMERGENCY CALL" : "Emergency Call"}
          </h2>
          <p className="text-gray-600 text-lg">Incoming emergency blood request</p>
        </div>

        {/* Requester Info */}
        <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-2xl p-6 mb-8 border border-red-200">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center mr-3">
              <User className="h-6 w-6 text-white" />
            </div>
            <span className="font-bold text-xl text-gray-800">{call.requester.name}</span>
          </div>
          
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-center bg-white rounded-lg p-3">
              <Droplet className="h-5 w-5 text-red-500 mr-3" />
              <span className="font-semibold">Needs: <span className="text-red-600 text-lg">{call.bloodRequest.bloodType}</span> - {call.bloodRequest.units} units</span>
            </div>
            
            {call.bloodRequest.hospital && (
              <div className="flex items-center justify-center bg-white rounded-lg p-3">
                <MapPin className="h-5 w-5 text-blue-500 mr-3" />
                <span className="font-medium">{call.bloodRequest.hospital}</span>
              </div>
            )}
            
            {call.bloodRequest.patientName && (
              <div className="flex items-center justify-center bg-white rounded-lg p-3">
                <User className="h-5 w-5 text-green-500 mr-3" />
                <span className="font-medium">Patient: {call.bloodRequest.patientName}</span>
              </div>
            )}
            
            {call.bloodRequest.notes && (
              <div className="bg-white rounded-lg p-3 text-gray-700">
                <span className="font-medium">Notes:</span> {call.bloodRequest.notes}
              </div>
            )}
          </div>
        </div>

        {/* Timer */}
        <div className="mb-8">
          <div className="flex items-center justify-center mb-3">
            <Clock className="h-5 w-5 text-gray-500 mr-2" />
            <span className="text-gray-600 font-medium">Time remaining</span>
          </div>
          <div className="text-4xl font-bold text-red-600 bg-red-50 rounded-full w-20 h-20 mx-auto flex items-center justify-center">
            {timeLeft}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-4">
          <button
            onClick={handleReject}
            className="flex-1 bg-gray-300 text-gray-700 px-6 py-4 rounded-xl hover:bg-gray-400 flex items-center justify-center font-semibold text-lg transition-all duration-200 hover:scale-105"
          >
            <PhoneOff className="h-6 w-6 mr-3" />
            Reject
          </button>
          <button
            onClick={handleAccept}
            className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-4 rounded-xl hover:from-green-600 hover:to-green-700 flex items-center justify-center font-semibold text-lg transition-all duration-200 hover:scale-105 shadow-lg"
          >
            <Phone className="h-6 w-6 mr-3" />
            Accept Call
          </button>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="mt-6 text-gray-500 hover:text-gray-700 text-sm underline"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default EmergencyCallPopup; 