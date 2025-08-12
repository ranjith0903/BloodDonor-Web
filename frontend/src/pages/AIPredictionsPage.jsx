import React, { useState } from 'react';
import { Brain, TrendingUp, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import axios from '../lib/axios';
import { toast } from 'react-hot-toast';

const AIPredictionsPage = () => {
  const [predictionData, setPredictionData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    bloodType: 'O+',
    location: {
      type: 'Point',
      coordinates: [0, 0]
    },
    date: new Date().toISOString().split('T')[0]
  });

  const handleLocationChange = () => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData(prev => ({
          ...prev,
          location: {
            type: 'Point',
            coordinates: [position.coords.longitude, position.coords.latitude]
          }
        }));
        toast.success('Location updated!');
      },
      (error) => {
        toast.error('Failed to get location. Please enable location access.');
      }
    );
  };

  const handlePredict = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await axios.post('/ai-prediction/predict-demand', formData);
      setPredictionData(response.data);
      toast.success('Prediction generated successfully!');
    } catch (error) {
      toast.error('Failed to generate prediction. Please try again.');
      console.error('Prediction error:', error);
    } finally {
      setLoading(false);
    }
  };

  const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <Brain className="h-12 w-12 text-red-600 mr-3" />
          <h1 className="text-3xl font-bold text-gray-900">AI Blood Demand Predictions</h1>
        </div>
        <p className="text-gray-600 text-lg">
          Get AI-powered predictions for blood demand in your area using machine learning algorithms
        </p>
      </div>

      {/* Prediction Form */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Generate Prediction</h2>
        <form onSubmit={handlePredict} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Blood Type
              </label>
              <select
                value={formData.bloodType}
                onChange={(e) => setFormData(prev => ({ ...prev, bloodType: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                {bloodTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handleLocationChange}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Update Location
            </button>
            
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center"
            >
              {loading ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Generate Prediction
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Prediction Results */}
      {predictionData && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Prediction Results</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-red-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Predicted Demand</p>
                  <p className="text-2xl font-bold text-red-600">{predictionData.predictedDemand}</p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Available Donors</p>
                  <p className="text-2xl font-bold text-green-600">{predictionData.availableDonors}</p>
                </div>
              </div>
            </div>

            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="flex items-center">
                <AlertTriangle className="h-8 w-8 text-orange-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Shortage</p>
                  <p className="text-2xl font-bold text-orange-600">{predictionData.shortage}</p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center">
                <Brain className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Confidence</p>
                  <p className="text-2xl font-bold text-blue-600">{predictionData.confidence}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">AI Recommendation</h3>
            <p className="text-gray-700">{predictionData.recommendation}</p>
          </div>

          <div className="mt-4 text-sm text-gray-600">
            <p>Based on {predictionData.historicalDataPoints} historical data points</p>
          </div>
        </div>
      )}

      {/* How it works */}
      <div className="bg-white rounded-lg shadow-lg p-6 mt-8">
        <h2 className="text-xl font-semibold mb-4">How AI Predictions Work</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
              <TrendingUp className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="font-semibold mb-2">Historical Analysis</h3>
            <p className="text-gray-600 text-sm">
              Analyzes 6 months of blood demand and supply data
            </p>
          </div>
          
          <div className="text-center">
            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
              <Brain className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="font-semibold mb-2">Seasonal Patterns</h3>
            <p className="text-gray-600 text-sm">
              Considers seasonal factors and blood type variations
            </p>
          </div>
          
          <div className="text-center">
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="font-semibold mb-2">Smart Forecasting</h3>
            <p className="text-gray-600 text-sm">
              Provides confidence scores and actionable recommendations
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIPredictionsPage; 