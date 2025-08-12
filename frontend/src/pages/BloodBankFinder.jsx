import React, { useState, useEffect } from 'react';
import axios from '../lib/axios';
import { toast } from 'react-hot-toast';
import { MapPinIcon, PhoneIcon, ClockIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

const BloodBankFinder = () => {
  const [userLocation, setUserLocation] = useState(null);
  const [bloodBanks, setBloodBanks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedBloodType, setSelectedBloodType] = useState('');
  const [selectedBank, setSelectedBank] = useState(null);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestForm, setRequestForm] = useState({
    bloodType: '',
    component: 'whole_blood',
    quantity: 1,
    priority: 'routine',
    purpose: 'emergency',
    requesterName: '',
    requesterPhone: '',
    requesterEmail: ''
  });

  const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
  const components = [
    { value: 'whole_blood', label: 'Whole Blood' },
    { value: 'red_cells', label: 'Red Blood Cells' },
    { value: 'platelets', label: 'Platelets' },
    { value: 'plasma', label: 'Plasma' },
    { value: 'cryoprecipitate', label: 'Cryoprecipitate' }
  ];

  useEffect(() => {
    getUserLocation();
  }, []);

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          toast.error('Unable to get your location. Please enter manually.');
          // Default to a location (you can set this to a default city)
          setUserLocation({ latitude: 12.3723, longitude: 76.5854 }); // Mysore, Karnataka
        }
      );
    } else {
      toast.error('Geolocation is not supported by this browser.');
      setUserLocation({ latitude: 12.3723, longitude: 76.5854 }); // Mysore, Karnataka
    }
  };

  const findNearbyBloodBanks = async () => {
    if (!userLocation) {
      toast.error('Please allow location access or enter location manually');
      return;
    }

    setLoading(true);
    try {
      const params = {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        maxDistance: 50000 // 50km
      };

      if (selectedBloodType) {
        params.bloodType = selectedBloodType;
      }

      const response = await axios.get('/blood-banks/nearby', { params });
      setBloodBanks(response.data.data);
      toast.success(`Found ${response.data.count} blood banks nearby`);
    } catch (error) {
      console.error('Error finding blood banks:', error);
      toast.error('Failed to find blood banks');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestBlood = async (e) => {
    e.preventDefault();
    
    if (!selectedBank) {
      toast.error('Please select a blood bank first');
      return;
    }

    try {
      const response = await axios.post('/blood-banks/request', {
        bloodBankId: selectedBank._id,
        ...requestForm
      });

      toast.success('Blood request submitted successfully!');
      setShowRequestForm(false);
      setSelectedBank(null);
      setRequestForm({
        bloodType: '',
        component: 'whole_blood',
        quantity: 1,
        priority: 'routine',
        purpose: 'emergency',
        requesterName: '',
        requesterPhone: '',
        requesterEmail: ''
      });
    } catch (error) {
      console.error('Error requesting blood:', error);
      toast.error('Failed to submit blood request');
    }
  };

  const getAvailabilityStatus = (availability) => {
    if (!availability || availability.length === 0) return 'none';
    const total = availability.reduce((sum, item) => sum + item.totalQuantity, 0);
    if (total === 0) return 'none';
    if (total < 5) return 'low';
    if (total < 20) return 'medium';
    return 'high';
  };

  const getAvailabilityColor = (status) => {
    switch (status) {
      case 'high': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-orange-600 bg-orange-100';
      case 'none': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Find Nearby Blood Banks
          </h1>
          <p className="text-gray-600">
            Locate blood banks near you and check real-time blood availability
          </p>
        </div>

        {/* Search Controls */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Blood Type (Optional)
              </label>
              <select
                value={selectedBloodType}
                onChange={(e) => setSelectedBloodType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="">All Blood Types</option>
                {bloodTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            
            <div className="flex items-end">
              <button
                onClick={findNearbyBloodBanks}
                disabled={loading || !userLocation}
                className="w-full bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Searching...' : 'Find Blood Banks'}
              </button>
            </div>

            <div className="flex items-end">
              <button
                onClick={getUserLocation}
                className="w-full bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
              >
                Update Location
              </button>
            </div>
          </div>

          {userLocation && (
            <div className="mt-4 text-sm text-gray-600">
              <MapPinIcon className="inline w-4 h-4 mr-1" />
              Location: {userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)}
            </div>
          )}
        </div>

        {/* Blood Banks List */}
        {bloodBanks.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bloodBanks.map((bank) => {
              const availabilityStatus = getAvailabilityStatus(bank.availability);
              
              return (
                <div key={bank._id} className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{bank.name}</h3>
                        <p className="text-sm text-gray-600">{bank.code}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getAvailabilityColor(availabilityStatus)}`}>
                        {availabilityStatus === 'none' ? 'No Stock' : 
                         availabilityStatus === 'low' ? 'Low Stock' :
                         availabilityStatus === 'medium' ? 'Medium Stock' : 'High Stock'}
                      </span>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPinIcon className="w-4 h-4 mr-2" />
                        {bank.address.city}, {bank.address.state}
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-600">
                        <PhoneIcon className="w-4 h-4 mr-2" />
                        {bank.contact.phone}
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-600">
                        <ClockIcon className="w-4 h-4 mr-2" />
                        {bank.isOpen ? (
                          <span className="text-green-600 flex items-center">
                            <CheckCircleIcon className="w-4 h-4 mr-1" />
                            Open Now
                          </span>
                        ) : (
                          <span className="text-red-600 flex items-center">
                            <XCircleIcon className="w-4 h-4 mr-1" />
                            Closed
                          </span>
                        )}
                      </div>
                    </div>

                    {bank.availability && bank.availability.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Available Blood:</h4>
                        <div className="space-y-1">
                          {bank.availability.map((item, index) => (
                            <div key={index} className="text-sm text-gray-600">
                              {item._id}: {item.totalQuantity} units
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setSelectedBank(bank);
                          setShowRequestForm(true);
                        }}
                        className="flex-1 bg-red-600 text-white px-3 py-2 rounded-md text-sm hover:bg-red-700"
                      >
                        Request Blood
                      </button>
                      <button
                        onClick={() => window.open(`tel:${bank.contact.phone}`)}
                        className="flex-1 bg-gray-600 text-white px-3 py-2 rounded-md text-sm hover:bg-gray-700"
                      >
                        Call Now
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* No Results */}
        {bloodBanks.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🏥</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Blood Banks Found</h3>
            <p className="text-gray-600">Try adjusting your search criteria or location</p>
          </div>
        )}
      </div>

      {/* Request Blood Modal */}
      {showRequestForm && selectedBank && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Request Blood from {selectedBank.name}</h3>
            
            <form onSubmit={handleRequestBlood} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Blood Type *</label>
                <select
                  required
                  value={requestForm.bloodType}
                  onChange={(e) => setRequestForm({...requestForm, bloodType: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="">Select Blood Type</option>
                  {bloodTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Component *</label>
                <select
                  required
                  value={requestForm.component}
                  onChange={(e) => setRequestForm({...requestForm, component: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  {components.map(comp => (
                    <option key={comp.value} value={comp.value}>{comp.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={requestForm.quantity}
                    onChange={(e) => setRequestForm({...requestForm, quantity: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority *</label>
                  <select
                    required
                    value={requestForm.priority}
                    onChange={(e) => setRequestForm({...requestForm, priority: e.target.value})}
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
                  value={requestForm.purpose}
                  onChange={(e) => setRequestForm({...requestForm, purpose: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="emergency">Emergency</option>
                  <option value="surgery">Surgery</option>
                  <option value="transfusion">Transfusion</option>
                  <option value="testing">Testing</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Your Name *</label>
                <input
                  type="text"
                  required
                  value={requestForm.requesterName}
                  onChange={(e) => setRequestForm({...requestForm, requesterName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                <input
                  type="tel"
                  required
                  value={requestForm.requesterPhone}
                  onChange={(e) => setRequestForm({...requestForm, requesterPhone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={requestForm.requesterEmail}
                  onChange={(e) => setRequestForm({...requestForm, requesterEmail: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowRequestForm(false)}
                  className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BloodBankFinder; 