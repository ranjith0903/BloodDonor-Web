import express from 'express';
import axios from 'axios';

const router = express.Router();

const RAPIDAPI_KEY = "88fd9c2c97msha27e6dbccf6444cp1747edjsnbc90dddff5a0"; // Replace with your RapidAPI key
const RAPIDAPI_HOST = "wft-geo-db.p.rapidapi.com";

// Fetch Countries
router.get('/countries', async (req, res) => {
  try {
    const response = await axios.get(`https://${RAPIDAPI_HOST}/v1/geo/countries`, {
      headers: {
        "X-RapidAPI-Key": RAPIDAPI_KEY,
        "X-RapidAPI-Host": RAPIDAPI_HOST,
      },
    });
    res.json(response.data.data);
  } catch (error) {
    res.status(500).send("Error fetching countries");
  }
});

// Fetch States by Country Code
router.get('/countries/:countryCode/regions', async (req, res) => {
  const { countryCode } = req.params;
  try {
    const response = await axios.get(`https://${RAPIDAPI_HOST}/v1/geo/countries/${countryCode}/regions`, {
      headers: {
        "X-RapidAPI-Key": RAPIDAPI_KEY,
        "X-RapidAPI-Host": RAPIDAPI_HOST,
      },
    });
    res.json(response.data.data);
  } catch (error) {
    res.status(500).send("Error fetching states");
  }
});

// Fetch Cities by Region Code
router.get('/regions/:regionCode/cities', async (req, res) => {
  const { regionCode } = req.params;
  try {
    const response = await axios.get(`https://${RAPIDAPI_HOST}/v1/geo/regions/${regionCode}/cities`, {
      headers: {
        "X-RapidAPI-Key": RAPIDAPI_KEY,
        "X-RapidAPI-Host": RAPIDAPI_HOST,
      },
    });
    res.json(response.data.data);
  } catch (error) {
    res.status(500).send("Error fetching cities");
  }
});

export default router;
