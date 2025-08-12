import React, { useState, useEffect } from "react";
import axios from "axios";

const LocationForm = () => {
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);

  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [street, setStreet] = useState("");

  // Fetch Countries
  useEffect(() => {
    axios
      .get("/api/locations/countries") // Update with your backend endpoint
      .then((response) => setCountries(response.data))
      .catch((error) => console.error("Error fetching countries:", error));
  }, []);

  // Fetch States
  useEffect(() => {
    if (selectedCountry) {
      axios
        .get(`/api/locations/countries/${selectedCountry}/regions`)
        .then((response) => setStates(response.data))
        .catch((error) => console.error("Error fetching states:", error));
    } else {
      setStates([]);
    }
  }, [selectedCountry]);

  // Fetch Cities
  useEffect(() => {
    if (selectedState) {
      axios
        .get(`/api/locations/regions/${selectedState}/cities`)
        .then((response) => setCities(response.data))
        .catch((error) => console.error("Error fetching cities:", error));
    } else {
      setCities([]);
    }
  }, [selectedState]);

  return (
    <form className="p-4 space-y-4 bg-gray-50 rounded shadow-md">
      <div>
        <label className="block text-gray-700 font-semibold">Country</label>
        <select
          value={selectedCountry}
          onChange={(e) => setSelectedCountry(e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-2"
        >
          <option value="">Select Country</option>
          {countries.map((country) => (
            <option key={country.code} value={country.code}>
              {country.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-gray-700 font-semibold">State</label>
        <select
          value={selectedState}
          onChange={(e) => setSelectedState(e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-2"
          disabled={!selectedCountry}
        >
          <option value="">Select State</option>
          {states.map((state) => (
            <option key={state.code} value={state.code}>
              {state.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-gray-700 font-semibold">City</label>
        <select
          value={selectedCity}
          onChange={(e) => setSelectedCity(e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-2"
          disabled={!selectedState}
        >
          <option value="">Select City</option>
          {cities.map((city) => (
            <option key={city.id} value={city.id}>
              {city.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-gray-700 font-semibold">Street Address</label>
        <input
          type="text"
          value={street}
          onChange={(e) => setStreet(e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-2"
          placeholder="Enter your street address"
        />
      </div>

      <button
        type="submit"
        className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
      >
        Submit
      </button>
    </form>
  );
};

export default LocationForm;
