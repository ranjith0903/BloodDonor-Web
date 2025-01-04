import React, { useState, useEffect } from 'react';

const LocationComponent = () => {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if geolocation is available
    if ("geolocation" in navigator) {
      // Get the current position
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          
          setLocation({ latitude, longitude });
        },
        (err) => {
          setError("Error getting location: " + err.message);
        }
      );
    } else {
      setError("Geolocation is not supported by this browser.");
    }
  }, []);

  if (error) {
    return <div>{error}</div>;
  }

  if (location) {
    return (
      <div>
        <h3>Your current location is:</h3>
        <p>Latitude: {location.latitude}</p>
        <p>Longitude: {location.longitude}</p>
      </div>
    );
  }

  return <div>Loading location...</div>;
};

export default LocationComponent;
