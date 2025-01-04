import React, { useState, useEffect } from "react";
import axios from "axios";

import { useCampaignStore } from "../store/useCampaignStore";

const RegisterCampaign = () => {
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const { registerCampaign, loading } = useCampaignStore();

  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedState, setSelectedState] = useState("");

  const [formData, setFormData] = useState({
    campaignName: "",
    streetAddress: "",
    pincode: "",
    organizerName: "",
    organizerEmail: "",
    organizerContactNumber: "",
    country: "",
    state: "",
    city: "",
    date: "",
  });

  const fetchCountries = async () => {
    try {
      const response = await axios.get(
        `http://api.geonames.org/countryInfoJSON?username=ranjithhk13`
      ); // Replace `demo` with your GeoNames username
      setCountries(response.data.geonames);
    } catch (error) {
      console.error("Error fetching countries", error);
    }
  };

  const fetchStates = async (countryCode) => {
    try {
      const response = await axios.get(
        `http://api.geonames.org/childrenJSON?geonameId=${countryCode}&username=ranjithhk13`
      ); // Replace `demo` with your GeoNames username
      setStates(response.data.geonames);
    } catch (error) {
      console.error("Error fetching states", error);
    }
  };

  const fetchCities = async (stateId) => {
    try {
      const response = await axios.get(
        `http://api.geonames.org/childrenJSON?geonameId=${stateId}&username=ranjithhk13`
      ); // Replace `demo` with your GeoNames username
      setCities(response.data.geonames);
    } catch (error) {
      console.error("Error fetching cities", error);
    }
  };

  useEffect(() => {
    fetchCountries();
  }, []);

  useEffect(() => {
    if (selectedCountry) fetchStates(selectedCountry);
  }, [selectedCountry]);

  useEffect(() => {
    if (selectedState) fetchCities(selectedState);
  }, [selectedState]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    registerCampaign(formData);
  

    // You can add API call to save form data here
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-lg w-full">
        <h2 className="text-2xl font-bold text-center text-red-600 mb-6">
          Register a Campaign
        </h2>
        <form onSubmit={handleSubmit}>
          {/* Campaign Name */}
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">
              Campaign Name
            </label>
            <input
              type="text"
              name="campaignName"
              value={formData.campaignName}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg p-2"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">Date</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg p-2"
            />
          </div>

          {/* Country */}
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">
              Country
            </label>
            <select
              name="country"
              value={selectedCountry}
              onChange={(e) => {
                setSelectedCountry(e.target.value);
                setFormData({
                  ...formData,
                  country: e.target.options[e.target.selectedIndex].text,
                });
              }}
              required
              className="w-full border border-gray-300 rounded-lg p-2"
            >
              <option value="">Select Country</option>
              {countries.map((country) => (
                <option key={country.geonameId} value={country.geonameId}>
                  {country.countryName}
                </option>
              ))}
            </select>
          </div>

          {/* State */}
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">
              State
            </label>
            <select
              name="state"
              value={selectedState}
              onChange={(e) => {
                setSelectedState(e.target.value);
                setFormData({
                  ...formData,
                  state: e.target.options[e.target.selectedIndex].text,
                });
              }}
              required
              className="w-full border border-gray-300 rounded-lg p-2"
            >
              <option value="">Select State</option>
              {states.map((state) => (
                <option key={state.geonameId} value={state.geonameId}>
                  {state.name}
                </option>
              ))}
            </select>
          </div>

          {/* City */}
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">City</label>
            <select
              name="city"
              value={formData.city}
              onChange={(e) =>
                setFormData({ ...formData, city: e.target.value })
              }
              required
              className="w-full border border-gray-300 rounded-lg p-2"
            >
              <option value="">Select City</option>
              {cities.map((city) => (
                <option key={city.geonameId} value={city.name}>
                  {city.name}
                </option>
              ))}
            </select>
          </div>

          {/* Street Address */}
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">
              Street Address
            </label>
            <input
              type="text"
              name="streetAddress"
              value={formData.streetAddress}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg p-2"
            />
          </div>

          {/* Pincode */}
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">
              Pincode
            </label>
            <input
              type="text"
              name="pincode"
              value={formData.pincode}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg p-2"
            />
          </div>

          {/* Organizer Details */}
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">
              Organizer Name
            </label>
            <input
              type="text"
              name="organizerName"
              value={formData.organizerName}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg p-2"
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">
              Organizer Email
            </label>
            <input
              type="email"
              name="organizerEmail"
              value={formData.organizerEmail}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg p-2"
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">
              Organizer Contact Number
            </label>
            <input
              type="tel"
              name="organizerContactNumber"
              value={formData.organizerContactNumber}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg p-2"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-red-600 text-white p-2 rounded-lg hover:bg-red-700"
          >
            Register Campaign
          </button>
        </form>
      </div>
    </div>
  );
};

export default RegisterCampaign;
