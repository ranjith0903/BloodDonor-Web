import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useUserStore } from "../store/useUserStore";
import axios from "../lib/axios";
import { toast } from "react-hot-toast";
import { 
  Phone, 
  AlertTriangle, 
  MapPin, 
  User, 
  Droplet,
  Clock,
  CheckCircle
} from "lucide-react";
import EmergencyCallPopup from "../components/EmergencyCallPopup";

const EmergencyCallPage = () => {
  const { user, checkingAuth } = useUserStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [activeCalls, setActiveCalls] = useState([]);
  const [showCallPopup, setShowCallPopup] = useState(false);
  const [currentCall, setCurrentCall] = useState(null);
  const [acceptedCall, setAcceptedCall] = useState(null);
  const [acceptedDonors, setAcceptedDonors] = useState([]);
  const [showDonorModal, setShowDonorModal] = useState(false);
  const [showDetailedDonorModal, setShowDetailedDonorModal] = useState(false);
  const shownAcceptedCallsRef = useRef(new Set());
  const lastModalTimeRef = useRef(0);
  const [formData, setFormData] = useState({
    bloodType: "",
    units: 1,
    urgency: "critical",
    hospital: "",
    address: "",
    patientName: "",
    notes: ""
  });

  useEffect(() => {
    console.log("EmergencyCallPage useEffect:", { checkingAuth, user: !!user });
    
    if (checkingAuth) return; // Wait for auth check to complete
    
    if (!user) {
      console.log("No user, redirecting to login");
      navigate("/login");
      return;
    }
    
    console.log("User authenticated, fetching calls");
    fetchActiveCalls();
    
    // Poll for new calls every 5 seconds instead of 2 seconds
    const interval = setInterval(fetchActiveCalls, 5000);
    return () => clearInterval(interval);
  }, [user, navigate, checkingAuth]);

  const fetchActiveCalls = async () => {
    try {
      console.log("Fetching active calls...");
      const response = await axios.get("/emergency-calls/active");
      console.log("Active calls response:", response.data);
      setActiveCalls(response.data.data || []);
      
      // Check for ringing calls for current user
      const ringingCalls = response.data.data?.filter(call => 
        call.donorResponses?.some(dr => 
          dr.donorId === user._id && dr.status === "ringing"
        )
      );
      
      // Also check for connected calls where user hasn't responded yet
      const connectedCallsForDonor = response.data.data?.filter(call => 
        call.status === "connected" &&
        call.donorResponses?.some(dr => 
          dr.donorId === user._id && dr.status === "ringing"
        )
      );
      
      const allActiveCallsForDonor = [...ringingCalls, ...connectedCallsForDonor];
      
      if (allActiveCallsForDonor?.length > 0 && !showCallPopup) {
        setCurrentCall(allActiveCallsForDonor[0]);
        setShowCallPopup(true);
      } else if (allActiveCallsForDonor?.length === 0 && showCallPopup) {
        // If no active calls and popup is showing, close it
        setShowCallPopup(false);
        setCurrentCall(null);
      }

      // Check for accepted calls (requester perspective)
      const acceptedCalls = response.data.data?.filter(call => 
        call.requester.userId === user._id && 
        call.status === "connected" && 
        call.acceptedDonors &&
        call.acceptedDonors.length > 0
      );
      
      if (acceptedCalls?.length > 0 && !showDonorModal && !showDetailedDonorModal) {
        const call = acceptedCalls[0];
        
        // Check if we've already shown the modal for this call
        if (!shownAcceptedCallsRef.current.has(call.callId)) {
          const now = Date.now();
          // Prevent showing modal more than once every 5 seconds
          if (now - lastModalTimeRef.current > 5000) {
            setAcceptedCall(call);
            setAcceptedDonors(call.acceptedDonors);
            setShowDonorModal(true);
            shownAcceptedCallsRef.current.add(call.callId);
            lastModalTimeRef.current = now;
            toast.success(`🎉 ${call.acceptedDonors.length} donor(s) have accepted your emergency call!`);
          }
        } else {
          // If we've already shown the modal, just show a subtle notification for new acceptances
          const previousCall = activeCalls.find(c => c.callId === call.callId);
          if (previousCall && call.acceptedDonors.length > previousCall.acceptedDonors?.length) {
            const newDonors = call.acceptedDonors.length - previousCall.acceptedDonors.length;
            toast.success(`🎉 ${newDonors} more donor(s) accepted your call!`);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching active calls:", error);
    }
  };

  const handleCreateCall = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post("/emergency-calls/create", formData);
      toast.success(response.data.data.message);
      
      // Reset form
      setFormData({
        bloodType: "",
        units: 1,
        urgency: "critical",
        hospital: "",
        address: "",
        patientName: "",
        notes: ""
      });
      
      // Clear shown accepted calls so we can show notifications for new calls
      shownAcceptedCallsRef.current = new Set();
      
      fetchActiveCalls();
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to create emergency call");
    } finally {
      setLoading(false);
    }
  };

  const handleCallAccept = (callData) => {
    setShowCallPopup(false);
    setCurrentCall(null);
    
    // Show contact details
    if (callData.requesterContact) {
      toast.success(`Connected! Call ${callData.requesterContact.phone} immediately.`);
    }
    
    fetchActiveCalls();
  };

  const handleCallReject = () => {
    setShowCallPopup(false);
    setCurrentCall(null);
    fetchActiveCalls();
  };

  const handleEndCall = async (callId) => {
    try {
      await axios.put(`/emergency-calls/${callId}/end`);
      toast.success("Emergency call ended");
      fetchActiveCalls();
    } catch (error) {
      toast.error("Failed to end call");
    }
  };

  const handleCloseDonorModal = () => {
    setShowDonorModal(false);
    setShowDetailedDonorModal(false);
    // Don't clear shownAcceptedCalls - we don't want to show the same call again
  };

  const handleCloseDetailedModal = () => {
    setShowDetailedDonorModal(false);
  };

  // Show loading while checking authentication
  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center space-x-3">
            <Phone className="h-8 w-8 text-red-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Emergency Call System</h1>
              <p className="text-gray-600">Ring nearby donors for immediate blood assistance</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Create Emergency Call */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
              Create Emergency Call
            </h2>
            
            <form onSubmit={handleCreateCall} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Blood Type *</label>
                  <select
                    required
                    value={formData.bloodType}
                    onChange={(e) => setFormData({...formData, bloodType: e.target.value})}
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
                    <option value="any">Any Type</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Units Needed *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.units}
                    onChange={(e) => setFormData({...formData, units: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Urgency *</label>
                <select
                  required
                  value={formData.urgency}
                  onChange={(e) => setFormData({...formData, urgency: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="critical">Critical (Immediate)</option>
                  <option value="emergency">Emergency (Within 2 hours)</option>
                  <option value="urgent">Urgent (Within 4 hours)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hospital</label>
                <input
                  type="text"
                  value={formData.hospital}
                  onChange={(e) => setFormData({...formData, hospital: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Hospital name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Full address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Patient Name</label>
                <input
                  type="text"
                  value={formData.patientName}
                  onChange={(e) => setFormData({...formData, patientName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Patient's name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  rows="3"
                  placeholder="Any additional emergency details..."
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <Clock className="h-5 w-5 mr-2 animate-spin" />
                    Creating Call...
                  </>
                ) : (
                  <>
                    <Phone className="h-5 w-5 mr-2" />
                    Ring Nearby Donors
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Active Calls */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Phone className="h-5 w-5 text-blue-600 mr-2" />
              Active Emergency Calls ({activeCalls.length})
            </h2>
            
            <div className="space-y-4">
              {activeCalls.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No active emergency calls</p>
              ) : (
                activeCalls.map((call) => (
                  <div key={call.callId} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          call.status === "ringing" ? "bg-yellow-100 text-yellow-800" :
                          call.status === "connected" ? "bg-green-100 text-green-800" :
                          "bg-gray-100 text-gray-800"
                        }`}>
                          {call.status.toUpperCase()}
                        </span>
                        <span className="text-xs text-gray-500">
                          {Math.ceil((new Date() - new Date(call.timeline.callStarted)) / (1000 * 60))}m ago
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Droplet className="h-4 w-4 text-red-600" />
                        <span className="font-medium">{call.bloodRequest.bloodType} - {call.bloodRequest.units} units</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">Requested by: {call.requester.name}</span>
                      </div>
                      {call.bloodRequest.hospital && (
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">{call.bloodRequest.hospital}</span>
                        </div>
                      )}
                      <div className="text-sm text-gray-600">
                        {call.donorResponses?.length || 0} donors notified
                      </div>
                      
                      {/* Show accepted donors in a compact way */}
                      {call.acceptedDonors && call.acceptedDonors.length > 0 && (
                        <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold text-green-700">
                              ✅ {call.acceptedDonors.length} donor(s) accepted
                            </span>
                            <span className="text-xs text-green-600">
                              {new Date(call.acceptedDonors[0].acceptedAt).toLocaleTimeString()}
                            </span>
                          </div>
                          <div className="space-y-1">
                            {call.acceptedDonors.slice(0, 2).map((donor, index) => (
                              <div key={index} className="flex items-center justify-between text-xs">
                                <span className="text-gray-700">{donor.donorName}</span>
                                <span className="text-blue-600 font-medium">{donor.donorPhone}</span>
                              </div>
                            ))}
                            {call.acceptedDonors.length > 2 && (
                              <div className="text-xs text-gray-500 text-center">
                                +{call.acceptedDonors.length - 2} more donor(s)
                              </div>
                            )}
                          </div>
                          <button 
                            onClick={() => {
                              setAcceptedCall(call);
                              setAcceptedDonors(call.acceptedDonors);
                              setShowDetailedDonorModal(true);
                            }}
                            className="w-full mt-2 bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700"
                          >
                            View All Donors
                          </button>
                        </div>
                      )}
                    </div>

                    {call.status === "ringing" && call.requester.userId === user._id && (
                      <button
                        onClick={() => handleEndCall(call.callId)}
                        className="mt-3 bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700"
                      >
                        End Call
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Emergency Call Popup */}
        {showCallPopup && currentCall && (
          <EmergencyCallPopup
            call={currentCall}
            onAccept={handleCallAccept}
            onReject={handleCallReject}
            onClose={() => setShowCallPopup(false)}
          />
        )}

        {/* Donor Details Modal */}
        {showDonorModal && acceptedDonors.length > 0 && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center">
              <div className="mb-4">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-xl font-bold text-green-600 mb-1">Success!</h2>
                <p className="text-gray-600 text-sm">{acceptedDonors.length} donor(s) accepted your call</p>
              </div>
              
              {/* Quick Summary */}
              <div className="bg-green-50 rounded-xl p-4 mb-4 border border-green-200">
                <div className="flex items-center justify-center mb-2">
                  <span className="text-2xl font-bold text-green-600">{acceptedDonors.length}</span>
                  <span className="text-gray-600 ml-2">donor(s) available</span>
                </div>
                <p className="text-xs text-gray-500">All donors have been notified and are ready to help</p>
              </div>

              {/* First Donor Quick Info */}
              <div className="bg-blue-50 rounded-xl p-4 mb-4 border border-blue-200">
                <h3 className="font-semibold text-gray-800 mb-2 text-sm">Primary Contact</h3>
                <div className="text-left space-y-1">
                  <div className="flex items-center">
                    <User className="h-4 w-4 text-gray-500 mr-2" />
                    <span className="font-medium text-sm">{acceptedDonors[0].donorName}</span>
                  </div>
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 text-blue-500 mr-2" />
                    <span className="font-medium text-sm">{acceptedDonors[0].donorPhone}</span>
                  </div>
                  {acceptedDonors[0].donorBloodType && (
                    <div className="flex items-center">
                      <Droplet className="h-4 w-4 text-red-500 mr-2" />
                      <span className="text-sm">Blood Type: {acceptedDonors[0].donorBloodType}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button 
                  onClick={() => window.open(`tel:${acceptedDonors[0]?.donorPhone}`, '_self')} 
                  className="w-full bg-green-600 text-white px-4 py-3 rounded-xl hover:bg-green-700 font-semibold text-sm"
                >
                  📞 Call Primary Donor
                </button>
                
                {acceptedDonors.length > 1 && (
                  <button 
                    onClick={() => {
                      setShowDonorModal(false);
                      setShowDetailedDonorModal(true);
                    }} 
                    className="w-full bg-blue-600 text-white px-4 py-3 rounded-xl hover:bg-blue-700 font-semibold text-sm"
                  >
                    👥 View All {acceptedDonors.length} Donors
                  </button>
                )}
                
                <button 
                  onClick={handleCloseDonorModal} 
                  className="w-full bg-gray-300 text-gray-700 px-4 py-3 rounded-xl hover:bg-gray-400 font-semibold text-sm"
                >
                  Close
                </button>
              </div>

              {/* Small Info */}
              <p className="text-xs text-gray-500 mt-3">
                💡 You can view all donor details in the Emergency Calls section
              </p>
            </div>
          </div>
        )}

        {/* Detailed Donor List Modal */}
        {showDetailedDonorModal && acceptedDonors.length > 0 && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl p-6 max-w-md w-full text-center">
              <div className="mb-4">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <User className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-xl font-bold text-blue-600 mb-1">All Accepted Donors</h2>
                <p className="text-gray-600 text-sm">{acceptedDonors.length} donor(s) ready to help</p>
              </div>
              
              <div className="bg-blue-50 rounded-xl p-4 mb-4 border border-blue-200 max-h-80 overflow-y-auto">
                <div className="space-y-3">
                  {acceptedDonors.map((donor, index) => (
                    <div key={index} className="bg-white rounded-lg p-3 border border-blue-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-blue-700 text-sm">Donor #{index + 1}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(donor.acceptedAt).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="space-y-1 text-left">
                        <div className="flex items-center">
                          <User className="h-4 w-4 text-gray-500 mr-2" />
                          <span className="font-medium text-sm">{donor.donorName}</span>
                        </div>
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 text-blue-500 mr-2" />
                          <span className="font-medium text-sm">{donor.donorPhone}</span>
                        </div>
                        {donor.donorEmail && (
                          <div className="flex items-center">
                            <svg className="h-4 w-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                            </svg>
                            <span className="text-sm">{donor.donorEmail}</span>
                          </div>
                        )}
                        {donor.donorBloodType && (
                          <div className="flex items-center">
                            <Droplet className="h-4 w-4 text-red-500 mr-2" />
                            <span className="text-sm">Blood Type: {donor.donorBloodType}</span>
                          </div>
                        )}
                      </div>
                      <button 
                        onClick={() => window.open(`tel:${donor.donorPhone}`, '_self')}
                        className="w-full mt-2 bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700"
                      >
                        📞 Call This Donor
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              
              <button 
                onClick={handleCloseDetailedModal} 
                className="w-full bg-gray-300 text-gray-700 px-4 py-3 rounded-xl hover:bg-gray-400 font-semibold text-sm"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmergencyCallPage; 