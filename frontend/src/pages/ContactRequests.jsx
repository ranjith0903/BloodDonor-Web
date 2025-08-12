import React, { useState, useEffect } from 'react';
import axios from '../lib/axios';
import { toast } from 'react-hot-toast';
import { useUserStore } from '../store/useUserStore';
import { 
  PhoneIcon, 
  ClockIcon, 
  UserIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  ExclamationTriangleIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

const ContactRequests = () => {
  const { user } = useUserStore();
  const [activeTab, setActiveTab] = useState('received'); // 'received' or 'sent'
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (user) {
      fetchRequests();
    }
  }, [user, activeTab]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const endpoint = activeTab === 'received' ? '/contact-requests/donor' : '/contact-requests/requester';
      const response = await axios.get(endpoint);
      setRequests(response.data.data);
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast.error('Failed to fetch requests');
    } finally {
      setLoading(false);
    }
  };

  const handleRespondToRequest = async (requestId, action, message = '', availableDate = '', preferredContact = '') => {
    try {
      await axios.put(`/contact-requests/respond/${requestId}`, {
        action,
        message,
        availableDate,
        preferredContact
      });

      toast.success(`Request ${action} successfully`);
      fetchRequests();
    } catch (error) {
      console.error('Error responding to request:', error);
      toast.error(error.response?.data?.error || 'Failed to respond to request');
    }
  };

  const handleCompleteRequest = async (requestId) => {
    try {
      await axios.put(`/contact-requests/complete/${requestId}`);
      toast.success('Request marked as completed');
      fetchRequests();
    } catch (error) {
      console.error('Error completing request:', error);
      toast.error('Failed to complete request');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'expired': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'emergency': return 'bg-orange-100 text-orange-800';
      case 'urgent': return 'bg-yellow-100 text-yellow-800';
      case 'routine': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const RequestCard = ({ request }) => (
    <div className="bg-white rounded-lg shadow-md p-6 mb-4">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold">
            {activeTab === 'received' ? request.requester.name : request.donor.name}
          </h3>
          <p className="text-sm text-gray-600">
            Blood Type: {request.bloodRequest.bloodType} | Units: {request.bloodRequest.units}
          </p>
        </div>
        <div className="flex space-x-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
            {request.status}
          </span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getUrgencyColor(request.bloodRequest.urgency)}`}>
            {request.bloodRequest.urgency}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm text-gray-600">
            <strong>Purpose:</strong> {request.bloodRequest.purpose}
          </p>
          <p className="text-sm text-gray-600">
            <strong>Requested:</strong> {formatDate(request.timeline.requestedAt)}
          </p>
          {request.bloodRequest.hospital && (
            <p className="text-sm text-gray-600">
              <strong>Hospital:</strong> {request.bloodRequest.hospital}
            </p>
          )}
        </div>
        <div>
          {request.bloodRequest.requiredBy && (
            <p className="text-sm text-gray-600">
              <strong>Required By:</strong> {formatDate(request.bloodRequest.requiredBy)}
            </p>
          )}
          {request.donorResponse?.message && (
            <p className="text-sm text-gray-600">
              <strong>Response:</strong> {request.donorResponse.message}
            </p>
          )}
        </div>
      </div>

      <div className="flex space-x-2">
        <button
          onClick={() => {
            setSelectedRequest(request);
            setShowDetails(true);
          }}
          className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
        >
          <EyeIcon className="w-4 h-4 mr-1" />
          View Details
        </button>

        {activeTab === 'received' && request.status === 'pending' && (
          <>
            <button
              onClick={() => handleRespondToRequest(request.requestId, 'approved')}
              className="flex items-center px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
            >
              <CheckCircleIcon className="w-4 h-4 mr-1" />
              Approve
            </button>
            <button
              onClick={() => handleRespondToRequest(request.requestId, 'rejected')}
              className="flex items-center px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
            >
              <XCircleIcon className="w-4 h-4 mr-1" />
              Reject
            </button>
          </>
        )}

        {(request.status === 'approved' || request.status === 'pending') && (
          <button
            onClick={() => handleCompleteRequest(request.requestId)}
            className="flex items-center px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm"
          >
            <CheckCircleIcon className="w-4 h-4 mr-1" />
            Mark Complete
          </button>
        )}
      </div>
    </div>
  );

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Please login to view contact requests</h1>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Contact Requests</h1>
          <p className="text-gray-600">Manage your blood donation requests</p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex space-x-4">
            <button
              onClick={() => setActiveTab('received')}
              className={`px-4 py-2 rounded-md font-medium ${
                activeTab === 'received'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <UserIcon className="w-4 h-4 inline mr-2" />
              Requests Received ({requests.filter(r => r.status === 'pending').length})
            </button>
            <button
              onClick={() => setActiveTab('sent')}
              className={`px-4 py-2 rounded-md font-medium ${
                activeTab === 'sent'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <PhoneIcon className="w-4 h-4 inline mr-2" />
              Requests Sent
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading requests...</p>
          </div>
        )}

        {/* Requests List */}
        {!loading && (
          <div>
            {requests.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">📋</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No {activeTab} requests
                </h3>
                <p className="text-gray-600">
                  {activeTab === 'received' 
                    ? "You haven't received any contact requests yet."
                    : "You haven't sent any contact requests yet."
                  }
                </p>
              </div>
            ) : (
              <div>
                {requests.map((request) => (
                  <RequestCard key={request.requestId} request={request} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Request Details Modal */}
        {showDetails && selectedRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold">Request Details</h3>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Request Information</h4>
                    <p><strong>Request ID:</strong> {selectedRequest.requestId}</p>
                    <p><strong>Blood Type:</strong> {selectedRequest.bloodRequest.bloodType}</p>
                    <p><strong>Units:</strong> {selectedRequest.bloodRequest.units}</p>
                    <p><strong>Urgency:</strong> {selectedRequest.bloodRequest.urgency}</p>
                    <p><strong>Purpose:</strong> {selectedRequest.bloodRequest.purpose}</p>
                    <p><strong>Status:</strong> {selectedRequest.status}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Timeline</h4>
                    <p><strong>Requested:</strong> {formatDate(selectedRequest.timeline.requestedAt)}</p>
                    {selectedRequest.timeline.viewedAt && (
                      <p><strong>Viewed:</strong> {formatDate(selectedRequest.timeline.viewedAt)}</p>
                    )}
                    {selectedRequest.timeline.respondedAt && (
                      <p><strong>Responded:</strong> {formatDate(selectedRequest.timeline.respondedAt)}</p>
                    )}
                    {selectedRequest.timeline.contactSharedAt && (
                      <p><strong>Contact Shared:</strong> {formatDate(selectedRequest.timeline.contactSharedAt)}</p>
                    )}
                    {selectedRequest.timeline.completedAt && (
                      <p><strong>Completed:</strong> {formatDate(selectedRequest.timeline.completedAt)}</p>
                    )}
                  </div>
                </div>

                {selectedRequest.bloodRequest.hospital && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Hospital Information</h4>
                    <p><strong>Hospital:</strong> {selectedRequest.bloodRequest.hospital}</p>
                    {selectedRequest.bloodRequest.patientName && (
                      <p><strong>Patient:</strong> {selectedRequest.bloodRequest.patientName}</p>
                    )}
                    {selectedRequest.bloodRequest.patientAge && (
                      <p><strong>Patient Age:</strong> {selectedRequest.bloodRequest.patientAge}</p>
                    )}
                    {selectedRequest.bloodRequest.patientGender && (
                      <p><strong>Patient Gender:</strong> {selectedRequest.bloodRequest.patientGender}</p>
                    )}
                  </div>
                )}

                {selectedRequest.donorResponse && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Donor Response</h4>
                    <p><strong>Action:</strong> {selectedRequest.donorResponse.action}</p>
                    {selectedRequest.donorResponse.message && (
                      <p><strong>Message:</strong> {selectedRequest.donorResponse.message}</p>
                    )}
                    {selectedRequest.donorResponse.availableDate && (
                      <p><strong>Available Date:</strong> {formatDate(selectedRequest.donorResponse.availableDate)}</p>
                    )}
                    {selectedRequest.donorResponse.preferredContact && (
                      <p><strong>Preferred Contact:</strong> {selectedRequest.donorResponse.preferredContact}</p>
                    )}
                  </div>
                )}

                {/* Show contact information only if approved */}
                {selectedRequest.status === 'approved' && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Contact Information</h4>
                    {activeTab === 'received' ? (
                      <div>
                        <p><strong>Requester Name:</strong> {selectedRequest.requester.name}</p>
                        <p><strong>Requester Phone:</strong> {selectedRequest.requester.phone}</p>
                        <p><strong>Requester Email:</strong> {selectedRequest.requester.email}</p>
                      </div>
                    ) : (
                      <div>
                        <p><strong>Donor Name:</strong> {selectedRequest.donor.name}</p>
                        <p><strong>Donor Phone:</strong> {selectedRequest.donor.phone}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowDetails(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContactRequests; 