const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());

const WEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;
const BASE_URL = "https://api.openweathermap.org/data/2.5/";

function getWeatherUrl(type, city) {
  if (type === 'current') {
    return `${BASE_URL}weather?q=${encodeURIComponent(city)}&units=metric&appid=${WEATHER_API_KEY}`;
  } else if (type === 'forecast') {
    return `${BASE_URL}forecast?q=${encodeURIComponent(city)}&units=metric&appid=${WEATHER_API_KEY}`;
  }
  return '';
}

app.get('/api/weather/current', async (req, res) => {
  const city = req.query.city;
  if (!city) return res.status(400).json({error: 'City is required'});
  try {
    const url = getWeatherUrl('current', city);
    const resp = await fetch(url);
    const data = await resp.json();
    if (data.cod !== 200) return res.status(404).json({error: data.message});
    // Simplify response
    res.json({
      city: data.name,
      country: data.sys.country,
      weather: {
        main: data.weather[0].main,
        description: data.weather[0].description,
        icon: data.weather[0].icon,
        temp: data.main.temp,
        feels_like: data.main.feels_like,
        humidity: data.main.humidity,
        wind: data.wind.speed,
        uv: null // UV not available in free API, could add from another source
      }
    });
  } catch (err) {
    res.status(500).json({error: 'Failed to fetch weather'});
  }
});

app.get('/api/weather/forecast', async (req, res) => {
  const city = req.query.city;
  if (!city) return res.status(400).json({error: 'City is required'});
  try {
    const url = getWeatherUrl('forecast', city);
    const resp = await fetch(url);
    const data = await resp.json();
    if (data.cod !== "200") return res.status(404).json({error: data.message});
    // Group forecast by day
    const daily = {};
    data.list.forEach(item => {
      const date = item.dt_txt.split(' ')[0];
      if (!daily[date]) daily[date] = [];
      daily[date].push(item);
    });
    // Simplify: One summary per day
    const forecast = Object.keys(daily).map(date => {
      const items = daily[date];
      const midday = items[Math.floor(items.length/2)];
      return {
        date,
        temp: midday.main.temp,
        main: midday.weather[0].main,
        description: midday.weather[0].description,
        icon: midday.weather[0].icon,
        humidity: midday.main.humidity,
        wind: midday.wind.speed
      };
    });
    res.json({city: data.city.name, country: data.city.country, forecast});
  } catch (err) {
    res.status(500).json({error: 'Failed to fetch forecast'});
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Weather backend running on port ${PORT}`));
