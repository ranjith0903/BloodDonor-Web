import React, { useState, useEffect, useRef } from 'react';
import { Phone, PhoneOff, Users, Clock, MapPin } from 'lucide-react';
import axios from '../lib/axios';

const EmergencyCallSystem = ({ emergency, onCallEnd }) => {
  const [currentCall, setCurrentCall] = useState(null);
  const [donorQueue, setDonorQueue] = useState([]);
  const [callStatus, setCallStatus] = useState('idle'); // idle, calling, connected, ended
  const [currentDonorIndex, setCurrentDonorIndex] = useState(0);
  const [callDuration, setCallDuration] = useState(0);
  const [rejectedCount, setRejectedCount] = useState(0);
  
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const callTimerRef = useRef(null);

  useEffect(() => {
    if (emergency && emergency.matchedDonors) {
      // Sort donors by distance and availability
      const sortedDonors = emergency.matchedDonors
        .filter(donor => donor.status === 'pending')
        .sort((a, b) => a.distance - b.distance);
      
      setDonorQueue(sortedDonors);
    }
  }, [emergency]);

  useEffect(() => {
    if (callStatus === 'calling' && donorQueue.length > 0) {
      // Auto-call next donor after 30 seconds if no response
      const timeout = setTimeout(() => {
        handleCallRejected();
      }, 30000);

      return () => clearTimeout(timeout);
    }
  }, [callStatus, donorQueue]);

  const startEmergencyCall = async () => {
    try {
      setCallStatus('calling');
      setCurrentDonorIndex(0);
      
      if (donorQueue.length === 0) {
        setCallStatus('no-donors');
        return;
      }

      await callNextDonor();
    } catch (error) {
      console.error('Failed to start emergency call:', error);
      setCallStatus('error');
    }
  };

  const callNextDonor = async () => {
    if (currentDonorIndex >= donorQueue.length) {
      setCallStatus('no-more-donors');
      return;
    }

    const currentDonor = donorQueue[currentDonorIndex];
    setCurrentCall(currentDonor);

    try {
      // Initialize WebRTC connection
      await initializeCall(currentDonor);
      
      // Start call timer
      callTimerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Failed to call donor:', error);
      handleCallRejected();
    }
  };

  const initializeCall = async (donor) => {
    try {
      // Get user media (microphone)
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true, 
        video: false 
      });
      localStreamRef.current = stream;

      // Create peer connection
      const peerConnection = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      });

      // Add local stream
      stream.getTracks().forEach(track => {
        peerConnection.addTrack(track, stream);
      });

      // Handle incoming stream
      peerConnection.ontrack = (event) => {
        remoteStreamRef.current = event.streams[0];
        // Update UI to show remote stream
      };

      // Create offer
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      // Send offer to donor via signaling server
      await axios.post('/emergency/call-offer', {
        emergencyId: emergency._id,
        donorId: donor.donorId,
        offer: offer
      });

      peerConnectionRef.current = peerConnection;

    } catch (error) {
      throw error;
    }
  };

  const handleCallAccepted = async () => {
    setCallStatus('connected');
    
    // Update emergency status
    await axios.post(`/emergency/${emergency._id}/accept`, {
      donorId: currentCall.donorId
    });

    // Connect donor and requester
    console.log('Call accepted! Connecting donor and requester...');
  };

  const handleCallRejected = async () => {
    setRejectedCount(prev => prev + 1);
    
    // Update donor status to rejected
    await axios.post(`/emergency/${emergency._id}/reject`, {
      donorId: currentCall.donorId
    });

    // Move to next donor
    setCurrentDonorIndex(prev => prev + 1);
    setCallDuration(0);
    
    if (currentDonorIndex + 1 < donorQueue.length) {
      // Call next donor
      setTimeout(() => {
        callNextDonor();
      }, 2000); // 2 second delay between calls
    } else {
      setCallStatus('no-more-donors');
    }
  };

  const endCall = () => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
    }
    
    setCallStatus('ended');
    setCurrentCall(null);
    setCallDuration(0);
    
    onCallEnd && onCallEnd();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-red-600 mb-2">
          Emergency Blood Request
        </h2>
        <p className="text-gray-600">
          {emergency?.bloodType} • {emergency?.units} units needed
        </p>
      </div>

      {/* Call Status */}
      <div className="mb-6">
        <div className="flex items-center justify-center mb-4">
          <div className={`w-4 h-4 rounded-full mr-2 ${
            callStatus === 'idle' ? 'bg-gray-400' :
            callStatus === 'calling' ? 'bg-yellow-400 animate-pulse' :
            callStatus === 'connected' ? 'bg-green-400' :
            'bg-red-400'
          }`}></div>
          <span className="font-semibold">
            {callStatus === 'idle' && 'Ready to call'}
            {callStatus === 'calling' && 'Calling donor...'}
            {callStatus === 'connected' && 'Connected'}
            {callStatus === 'ended' && 'Call ended'}
            {callStatus === 'no-donors' && 'No donors available'}
            {callStatus === 'no-more-donors' && 'No more donors to call'}
          </span>
        </div>

        {callStatus === 'calling' && currentCall && (
          <div className="text-center">
            <p className="text-lg font-semibold">{currentCall.donorName}</p>
            <p className="text-gray-600">{currentCall.distance}km away</p>
            <p className="text-sm text-gray-500">Calling...</p>
          </div>
        )}

        {callStatus === 'connected' && (
          <div className="text-center">
            <p className="text-lg font-semibold text-green-600">Connected!</p>
            <p className="text-gray-600">Duration: {formatTime(callDuration)}</p>
          </div>
        )}
      </div>

      {/* Call Controls */}
      <div className="flex justify-center space-x-4 mb-6">
        {callStatus === 'idle' && (
          <button
            onClick={startEmergencyCall}
            className="bg-red-600 text-white px-6 py-3 rounded-full hover:bg-red-700 flex items-center"
          >
            <Phone className="w-5 h-5 mr-2" />
            Start Emergency Call
          </button>
        )}

        {callStatus === 'calling' && (
          <>
            <button
              onClick={handleCallAccepted}
              className="bg-green-600 text-white px-4 py-2 rounded-full hover:bg-green-700"
            >
              Accept
            </button>
            <button
              onClick={handleCallRejected}
              className="bg-red-600 text-white px-4 py-2 rounded-full hover:bg-red-700"
            >
              Reject
            </button>
          </>
        )}

        {callStatus === 'connected' && (
          <button
            onClick={endCall}
            className="bg-gray-600 text-white px-4 py-2 rounded-full hover:bg-gray-700 flex items-center"
          >
            <PhoneOff className="w-4 h-4 mr-2" />
            End Call
          </button>
        )}
      </div>

      {/* Statistics */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="text-center">
            <p className="font-semibold">{donorQueue.length}</p>
            <p className="text-gray-600">Available Donors</p>
          </div>
          <div className="text-center">
            <p className="font-semibold">{rejectedCount}</p>
            <p className="text-gray-600">Rejected Calls</p>
          </div>
          <div className="text-center">
            <p className="font-semibold">{currentDonorIndex + 1}</p>
            <p className="text-gray-600">Current Call</p>
          </div>
          <div className="text-center">
            <p className="font-semibold">{formatTime(callDuration)}</p>
            <p className="text-gray-600">Call Duration</p>
          </div>
        </div>
      </div>

      {/* Donor Queue */}
      {donorQueue.length > 0 && (
        <div className="mt-4">
          <h3 className="font-semibold mb-2">Donor Queue</h3>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {donorQueue.map((donor, index) => (
              <div
                key={donor.donorId}
                className={`flex items-center justify-between p-2 rounded ${
                  index === currentDonorIndex && callStatus === 'calling'
                    ? 'bg-yellow-100 border-l-4 border-yellow-400'
                    : 'bg-gray-50'
                }`}
              >
                <div>
                  <p className="font-medium">{donor.donorName}</p>
                  <p className="text-sm text-gray-600">{donor.distance}km away</p>
                </div>
                <div className="text-sm text-gray-500">
                  {index === currentDonorIndex && callStatus === 'calling' && (
                    <Clock className="w-4 h-4 animate-spin" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EmergencyCallSystem; 