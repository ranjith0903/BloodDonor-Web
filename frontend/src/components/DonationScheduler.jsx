import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, CheckCircle, AlertTriangle, Heart, CalendarDays, Users } from 'lucide-react';
import axios from '../lib/axios';
import { useUserStore } from '../store/useUserStore';
import { toast } from 'react-hot-toast';

const DonationScheduler = () => {
  const { user } = useUserStore();
  const [hospitals, setHospitals] = useState([]);
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hospitalsLoading, setHospitalsLoading] = useState(false);
  const [eligibility, setEligibility] = useState(null);
  const [showEligibilityModal, setShowEligibilityModal] = useState(false);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [locationPermission, setLocationPermission] = useState('prompt'); // 'prompt', 'granted', 'denied'

  useEffect(() => {
    if (user) {
      fetchHospitals();
      checkEligibility();
      fetchUpcomingAppointments();
    }
  }, [user]);

  useEffect(() => {
    if (selectedHospital && selectedDate) {
      fetchAvailableSlots();
    }
  }, [selectedHospital, selectedDate]);

  // Check if user has blood type set
  useEffect(() => {
    if (user && !user.bloodType) {
      toast.error('Please set your blood type in your profile to schedule donations');
    }
  }, [user]);

  const fetchHospitals = async () => {
    setHospitalsLoading(true);
    try {
      // Try to get user's location first
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            setLocationPermission('granted');
            const { latitude, longitude } = position.coords;
            try {
              const response = await axios.get('/blood-banks/nearby', {
                params: {
                  latitude,
                  longitude,
                  maxDistance: 50000 // 50km radius
                }
              });
              setHospitals(response.data.data || []);
            } catch (error) {
              console.error('Error fetching nearby hospitals:', error);
              // Fallback to getting all hospitals
              await fetchAllHospitals();
            } finally {
              setHospitalsLoading(false);
            }
          },
          async (error) => {
            console.log('Location access denied, fetching all hospitals:', error);
            setLocationPermission('denied');
            // Fallback to getting all hospitals
            await fetchAllHospitals();
            setHospitalsLoading(false);
          }
        );
      } else {
        // Geolocation not supported, get all hospitals
        setLocationPermission('denied');
        await fetchAllHospitals();
        setHospitalsLoading(false);
      }
    } catch (error) {
      console.error('Error fetching hospitals:', error);
      toast.error('Failed to load hospitals');
      setHospitalsLoading(false);
    }
  };

  const fetchAllHospitals = async () => {
    try {
      const response = await axios.get('/blood-banks/all/public');
      setHospitals(response.data.data || []);
    } catch (error) {
      console.error('Error fetching all hospitals:', error);
      toast.error('Failed to load hospitals');
    }
  };

  const checkEligibility = async () => {
    try {
      const response = await axios.get('/donation-appointments/eligibility/check');
      console.log('Eligibility response:', response.data); // Debug log
      setEligibility(response.data.eligibility || response.data);
    } catch (error) {
      console.error('Error checking eligibility:', error);
      // Fallback: create basic eligibility data
      setEligibility({
        eligible: true,
        lastDonation: 'Never',
        nextEligibleDate: null,
        reason: null
      });
    }
  };

  const fetchAvailableSlots = async () => {
    if (!selectedHospital || !selectedDate || !user?.bloodType) return;

    setLoading(true);
    try {
      const response = await axios.get(`/donation-appointments/slots/available`, {
        params: {
          hospitalId: selectedHospital._id,
          date: selectedDate,
          bloodType: user.bloodType
        }
      });
      setAvailableSlots(response.data.slots || []);
    } catch (error) {
      console.error('Error fetching slots:', error);
      toast.error('Failed to load available slots');
    } finally {
      setLoading(false);
    }
  };

  const fetchUpcomingAppointments = async () => {
    try {
      const response = await axios.get('/donation-appointments/upcoming');
      setUpcomingAppointments(response.data.appointments || []);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    }
  };

  const handleScheduleAppointment = async () => {
    if (!selectedHospital || !selectedDate || !selectedTime) {
      toast.error('Please select hospital, date, and time');
      return;
    }

    if (!user.bloodType) {
      toast.error('Please set your blood type in your profile first');
      return;
    }

    if (!eligibility?.eligible) {
      setShowEligibilityModal(true);
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('/donation-appointments/schedule', {
        hospitalId: selectedHospital._id,
        date: selectedDate,
        time: selectedTime,
        bloodType: user.bloodType,
        notes: ''
      });

      toast.success('Appointment scheduled successfully!');
      
      // Reset form
      setSelectedDate('');
      setSelectedTime('');
      setSelectedHospital(null);
      
      // Refresh appointments
      fetchUpcomingAppointments();
      
    } catch (error) {
      console.error('Error scheduling appointment:', error);
      toast.error(error.response?.data?.error || 'Failed to schedule appointment');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAppointment = async (appointmentId) => {
    try {
      await axios.delete(`/donation-appointments/${appointmentId}`);
      toast.success('Appointment cancelled successfully');
      fetchUpcomingAppointments();
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      toast.error('Failed to cancel appointment');
    }
  };

  const getNextEligibleDate = () => {
    console.log('Getting next eligible date, eligibility:', eligibility); // Debug log
    if (!eligibility?.nextEligibleDate) {
      console.log('No nextEligibleDate found'); // Debug log
      return null;
    }
    const date = new Date(eligibility.nextEligibleDate);
    console.log('Parsed next eligible date:', date); // Debug log
    return date;
  };

  const calculateDaysRemaining = () => {
    console.log('Calculating days remaining, eligibility:', eligibility); // Debug log
    
    if (eligibility?.eligible) return 0;
    
    const nextEligible = getNextEligibleDate();
    console.log('Next eligible date:', nextEligible); // Debug log
    
    if (!nextEligible) return null;
    
    const today = new Date();
    const timeDiff = nextEligible.getTime() - today.getTime();
    const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    console.log('Days remaining calculated:', daysRemaining); // Debug log
    return Math.max(0, daysRemaining);
  };

  const formatDaysRemaining = (days) => {
    if (days === 0) return 'Today';
    if (days === 1) return '1 day';
    return `${days} days`;
  };

  const isDateEligible = (date) => {
    const nextEligible = getNextEligibleDate();
    if (!nextEligible) return true;
    return new Date(date) >= nextEligible;
  };

  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 9; hour <= 17; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      slots.push(`${hour.toString().padStart(2, '0')}:30`);
    }
    return slots;
  };

  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const generateCalendarDays = () => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const days = [];
    const nextEligible = getNextEligibleDate();

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const dateString = date.toISOString().split('T')[0];
      const isNextEligibleDate = nextEligible && date.toDateString() === nextEligible.toDateString();
      
      days.push({
        date: dateString,
        day: day,
        isToday: date.toDateString() === today.toDateString(),
        isPast: date < today,
        isEligible: isDateEligible(dateString),
        isNextEligibleDate: isNextEligibleDate,
        hasAppointment: upcomingAppointments.some(apt => apt.date === dateString)
      });
    }

    return days;
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Loading state when user is not loaded */}
      {!user && (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
        </div>
      )}

      {user && (
        <>
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Blood Donation Scheduler</h1>
            <p className="text-gray-600">Schedule your blood donation at nearby hospitals</p>
          </div>

          {/* Blood Type Warning */}
          {!user.bloodType && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
                <div>
                  <h3 className="text-sm font-semibold text-yellow-800">Blood Type Required</h3>
                  <p className="text-sm text-yellow-700">
                    Please set your blood type in your profile to schedule donations.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Eligibility Status */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {eligibility?.eligible ? (
                  <CheckCircle className="h-8 w-8 text-green-600" />
                ) : (
                  <AlertTriangle className="h-8 w-8 text-yellow-600" />
                )}
                <div>
                  <h3 className="text-lg font-semibold">
                    {eligibility?.eligible ? 'You are eligible to donate!' : 'Not eligible at this time'}
                  </h3>
                  <p className="text-gray-600">
                    {eligibility?.eligible 
                      ? `Last donation: ${eligibility.lastDonation || 'Never'}`
                      : `Next eligible: ${eligibility?.nextEligibleDate || 'Unknown'}`
                    }
                  </p>
                                     {!eligibility?.eligible && (
                     <div className="mt-2">
                       <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                         <Clock className="h-4 w-4 mr-1" />
                         {(() => {
                           const daysRemaining = calculateDaysRemaining();
                           return daysRemaining !== null ? formatDaysRemaining(daysRemaining) : 'Unknown';
                         })()} until eligible
                       </span>
                     </div>
                   )}
                </div>
              </div>
                             <div className="flex space-x-2">
                 <button
                   onClick={() => setShowEligibilityModal(true)}
                   className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                 >
                   View Details
                 </button>
                 {user?.role === 'admin' && (
                   <button
                     onClick={async () => {
                       try {
                         await axios.post('/donation-appointments/test/set-last-donation', { daysAgo: 30 });
                         toast.success('Test last donation date set!');
                         checkEligibility();
                       } catch (error) {
                         toast.error('Failed to set test date');
                       }
                     }}
                     className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm"
                   >
                     Set Test Date (30 days ago)
                   </button>
                 )}
               </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Hospital Selection */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                <MapPin className="h-5 w-5 mr-2" />
                Select Hospital
              </h3>
              
              {/* Location Permission Message */}
              {locationPermission === 'denied' && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800 mb-2">
                    💡 <strong>Tip:</strong> Enable location access to find hospitals near you, or we'll show all available hospitals.
                  </p>
                  <button
                    onClick={fetchHospitals}
                    className="text-xs bg-yellow-600 text-white px-3 py-1 rounded hover:bg-yellow-700 transition-colors"
                  >
                    Try with Location
                  </button>
                </div>
              )}
              
              {hospitalsLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                </div>
              ) : hospitals.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No hospitals found</p>
                  <p className="text-xs text-gray-400 mt-2">
                    If you're testing, you can create sample hospitals in the admin panel.
                  </p>
                  {user?.role === 'admin' && (
                    <button
                      onClick={async () => {
                        try {
                          await axios.post('/blood-banks/admin/sample-data');
                          toast.success('Sample hospitals created!');
                          fetchHospitals();
                        } catch (error) {
                          toast.error('Failed to create sample data');
                        }
                      }}
                      className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mr-2"
                    >
                      Create Sample Data
                    </button>
                  )}
                  <button
                    onClick={fetchHospitals}
                    className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Retry
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {hospitals.map((hospital) => (
                    <div
                      key={hospital._id}
                      onClick={() => setSelectedHospital(hospital)}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedHospital?._id === hospital._id
                          ? 'border-red-500 bg-red-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <h4 className="font-semibold">{hospital.name}</h4>
                      <p className="text-sm text-gray-600">{hospital.address?.street || hospital.address}</p>
                      <p className="text-sm text-gray-500">{hospital.address?.city || ''}</p>
                      {hospital.distance && (
                        <p className="text-sm text-gray-500">{hospital.distance}km away</p>
                      )}
                      <div className="flex items-center mt-2">
                        <Clock className="h-4 w-4 text-gray-400 mr-1" />
                        <span className="text-sm text-gray-500">{hospital.hours || 'Contact for hours'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Calendar */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Select Date
              </h3>
              <div className="grid grid-cols-7 gap-1 mb-4">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center text-sm font-semibold text-gray-600 p-2">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {generateCalendarDays().map((day) => (
                  <button
                    key={day.date}
                    onClick={() => setSelectedDate(day.date)}
                    disabled={day.isPast || !day.isEligible}
                    className={`p-2 text-sm rounded-lg transition-colors ${
                      selectedDate === day.date
                        ? 'bg-red-600 text-white'
                        : day.isPast
                        ? 'text-gray-300 cursor-not-allowed'
                        : !day.isEligible
                        ? 'text-gray-400 cursor-not-allowed'
                        : day.hasAppointment
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : day.isNextEligibleDate
                        ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border-2 border-yellow-400'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <div className="relative">
                      {day.day}
                      {day.isToday && (
                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-600 rounded-full"></div>
                      )}
                      {day.hasAppointment && (
                        <Heart className="absolute -bottom-1 -right-1 w-3 h-3 text-green-600" />
                      )}
                      {day.isNextEligibleDate && (
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-yellow-500 rounded-full flex items-center justify-center">
                          <span className="text-xs text-white font-bold">E</span>
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
              
              {/* Calendar Legend */}
              <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-600">
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-red-600 rounded-full"></div>
                  <span>Today</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Heart className="w-3 h-3 text-green-600" />
                  <span>Has appointment</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full flex items-center justify-center">
                    <span className="text-xs text-white font-bold">E</span>
                  </div>
                  <span>Next eligible date</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-gray-400 rounded"></div>
                  <span>Not eligible</span>
                </div>
              </div>
            </div>

            {/* Time Slots */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Select Time
              </h3>
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {generateTimeSlots().map((time) => (
                    <button
                      key={time}
                      onClick={() => setSelectedTime(time)}
                      disabled={!availableSlots.includes(time)}
                      className={`p-3 text-sm rounded-lg transition-colors ${
                        selectedTime === time
                          ? 'bg-red-600 text-white'
                          : availableSlots.includes(time)
                          ? 'bg-gray-100 hover:bg-gray-200'
                          : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Schedule Button */}
          <div className="mt-6 text-center">
            <button
              onClick={handleScheduleAppointment}
              disabled={!selectedHospital || !selectedDate || !selectedTime || loading || !user.bloodType}
              className="px-8 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-lg font-semibold"
            >
              {loading ? 'Scheduling...' : !user.bloodType ? 'Set Blood Type First' : 'Schedule Appointment'}
            </button>
          </div>

          {/* Upcoming Appointments */}
          {upcomingAppointments.length > 0 && (
            <div className="mt-8 bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                <CalendarDays className="h-5 w-5 mr-2" />
                Upcoming Appointments
              </h3>
              <div className="space-y-3">
                {upcomingAppointments.map((appointment) => (
                  <div key={appointment._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <Heart className="h-6 w-6 text-red-600" />
                      <div>
                        <h4 className="font-semibold">{appointment.hospital.name}</h4>
                        <p className="text-sm text-gray-600">
                          {new Date(appointment.date).toLocaleDateString()} at {appointment.time}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleCancelAppointment(appointment._id)}
                      className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Eligibility Modal */}
          {showEligibilityModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <h3 className="text-xl font-bold mb-4">Eligibility Details</h3>
                
                {/* Waiting Period Information */}
                {!eligibility?.eligible && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Clock className="h-5 w-5 text-yellow-600" />
                      <span className="font-semibold text-yellow-800">Waiting Period</span>
                    </div>
                    <p className="text-sm text-yellow-700 mb-2">
                      You must wait at least 8 weeks (56 days) between blood donations.
                    </p>
                    <div className="bg-white rounded p-3">
                                             <div className="flex justify-between items-center">
                         <span className="text-sm font-medium">Days remaining:</span>
                         <span className="text-lg font-bold text-yellow-600">
                           {(() => {
                             const daysRemaining = calculateDaysRemaining();
                             return daysRemaining !== null ? `${daysRemaining} days` : 'Unknown';
                           })()}
                         </span>
                       </div>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-sm font-medium">Next eligible date:</span>
                        <span className="text-sm text-gray-600">
                          {eligibility?.nextEligibleDate ? new Date(eligibility.nextEligibleDate).toLocaleDateString() : 'Unknown'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span>Age requirement: ✅ Met</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span>Weight requirement: ✅ Met</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span>Health status: ✅ Good</span>
                  </div>
                  {!eligibility?.eligible && (
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-600" />
                      <span>Time since last donation: {eligibility?.reason}</span>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setShowEligibilityModal(false)}
                  className="mt-6 w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DonationScheduler;
