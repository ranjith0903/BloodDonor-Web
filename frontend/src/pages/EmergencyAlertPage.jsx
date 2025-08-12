import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUserStore } from "../store/useUserStore";
import axios from "../lib/axios";
import { toast } from "react-hot-toast";
import { 
  AlertTriangle, 
  Clock, 
  MapPin, 
  Phone, 
  User, 
  Droplet,
  Plus,
  Eye,
  CheckCircle,
  XCircle
} from "lucide-react";

const EmergencyAlertPage = () => {
  const { user, checkingAuth } = useUserStore();
  const navigate = useNavigate();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [userAlerts, setUserAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    emergencyType: "accident",
    bloodType: "",
    units: 1,
    urgency: "critical",
    requiredBy: "",
    hospital: "",
    address: "",
    emergencyContact: "",
    role: "family",
    notes: ""
  });

  useEffect(() => {
    if (checkingAuth) return; // Wait for auth check to complete
    
    if (!user) {
      navigate("/login");
      return;
    }
    fetchActiveAlerts();
    fetchUserAlerts();
  }, [user, navigate, checkingAuth]);

  const fetchActiveAlerts = async () => {
    try {
      const response = await axios.get("/emergency-alerts/active");
      setActiveAlerts(response.data.data || []);
    } catch (error) {
      console.error("Error fetching active alerts:", error);
    }
  };

  const fetchUserAlerts = async () => {
    try {
      const response = await axios.get("/emergency-alerts/user");
      setUserAlerts(response.data.data || []);
    } catch (error) {
      console.error("Error fetching user alerts:", error);
    }
  };

  const handleCreateAlert = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post("/emergency-alerts/create", formData);
      toast.success(response.data.data.message);
      setShowCreateForm(false);
      setFormData({
        emergencyType: "accident",
        bloodType: "",
        units: 1,
        urgency: "critical",
        requiredBy: "",
        hospital: "",
        address: "",
        emergencyContact: "",
        role: "family",
        notes: ""
      });
      fetchActiveAlerts();
      fetchUserAlerts();
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to create emergency alert");
    } finally {
      setLoading(false);
    }
  };

  const handleRespondToAlert = async (alertId, status) => {
    try {
      await axios.post(`/emergency-alerts/${alertId}/respond`, { status });
      toast.success("Response recorded successfully");
      fetchActiveAlerts();
      fetchUserAlerts();
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to respond to alert");
    }
  };

  const handleResolveAlert = async (alertId) => {
    try {
      await axios.put(`/emergency-alerts/${alertId}/resolve`, { resolutionNotes: "Resolved by user" });
      toast.success("Emergency alert resolved");
      fetchActiveAlerts();
      fetchUserAlerts();
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to resolve alert");
    }
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case "critical": return "text-red-600 bg-red-100";
      case "emergency": return "text-orange-600 bg-orange-100";
      case "urgent": return "text-yellow-600 bg-yellow-100";
      default: return "text-gray-600 bg-gray-100";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active": return "text-red-600 bg-red-100";
      case "responding": return "text-blue-600 bg-blue-100";
      case "resolved": return "text-green-600 bg-green-100";
      default: return "text-gray-600 bg-gray-100";
    }
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
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Emergency Blood Alerts</h1>
                <p className="text-gray-600">Critical blood requests that need immediate attention</p>
              </div>
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center space-x-2"
            >
              <Plus className="h-5 w-5" />
              <span>Create Emergency Alert</span>
            </button>
          </div>
        </div>

        {/* Active Emergency Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Active Alerts */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
              Active Emergency Alerts ({activeAlerts.length})
            </h2>
            <div className="space-y-4">
              {activeAlerts.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No active emergency alerts</p>
              ) : (
                activeAlerts.map((alert) => (
                  <div key={alert.alertId} className="border border-red-200 rounded-lg p-4 bg-red-50">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getUrgencyColor(alert.bloodRequest.urgency)}`}>
                          {alert.bloodRequest.urgency.toUpperCase()}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(alert.status)}`}>
                          {alert.status.toUpperCase()}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {Math.ceil((new Date() - new Date(alert.timeline.created)) / (1000 * 60))}m ago
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Droplet className="h-4 w-4 text-red-600" />
                        <span className="font-medium">{alert.bloodRequest.bloodType} - {alert.bloodRequest.units} units</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">{alert.location.hospital || alert.location.address}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">Requested by: {alert.requester.name}</span>
                      </div>
                    </div>

                    <div className="mt-3 flex space-x-2">
                      <button
                        onClick={() => handleRespondToAlert(alert.alertId, "available")}
                        className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                      >
                        I'm Available
                      </button>
                      <button
                        onClick={() => handleRespondToAlert(alert.alertId, "on_way")}
                        className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                      >
                        On My Way
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* User's Alerts */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <User className="h-5 w-5 text-blue-600 mr-2" />
              My Emergency Alerts ({userAlerts.length})
            </h2>
            <div className="space-y-4">
              {userAlerts.length === 0 ? (
                <p className="text-gray-500 text-center py-8">You haven't created any emergency alerts</p>
              ) : (
                userAlerts.map((alert) => (
                  <div key={alert.alertId} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getUrgencyColor(alert.bloodRequest.urgency)}`}>
                          {alert.bloodRequest.urgency.toUpperCase()}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(alert.status)}`}>
                          {alert.status.toUpperCase()}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {Math.ceil((new Date() - new Date(alert.timeline.created)) / (1000 * 60))}m ago
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Droplet className="h-4 w-4 text-red-600" />
                        <span className="font-medium">{alert.bloodRequest.bloodType} - {alert.bloodRequest.units} units</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">{alert.location.hospital || alert.location.address}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-green-600">
                          {alert.responses.length} donors responded
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 flex space-x-2">
                      {alert.status === "active" && (
                        <button
                          onClick={() => handleResolveAlert(alert.alertId)}
                          className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                        >
                          Resolve
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Create Emergency Alert Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-red-600 flex items-center">
                  <AlertTriangle className="h-6 w-6 mr-2" />
                  Create Emergency Alert
                </h2>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleCreateAlert} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Type *</label>
                    <select
                      required
                      value={formData.emergencyType}
                      onChange={(e) => setFormData({...formData, emergencyType: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      <option value="accident">Accident</option>
                      <option value="surgery">Surgery</option>
                      <option value="hemorrhage">Hemorrhage</option>
                      <option value="trauma">Trauma</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

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
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Required By *</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.requiredBy}
                    onChange={(e) => setFormData({...formData, requiredBy: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact</label>
                    <input
                      type="text"
                      value={formData.emergencyContact}
                      onChange={(e) => setFormData({...formData, emergencyContact: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder="Emergency contact number"
                    />
                  </div>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Your Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="patient">Patient</option>
                    <option value="family">Family Member</option>
                    <option value="doctor">Doctor</option>
                    <option value="hospital">Hospital Staff</option>
                    <option value="emergency_contact">Emergency Contact</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    rows="3"
                    placeholder="Any additional information about the emergency..."
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50"
                  >
                    {loading ? "Creating..." : "Create Emergency Alert"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmergencyAlertPage; 