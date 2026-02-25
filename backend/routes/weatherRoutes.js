const express = require('express');
const router = express.Router();
const axios = require('axios');
require('dotenv').config({ path: '../config/.env' });

const WEATHER_API_KEY = process.env.WEATHER_API_KEY;

// Get current weather
router.get('/weather', async (req, res) => {
  try {
    // If no API key, return mock data
    if (!WEATHER_API_KEY || WEATHER_API_KEY === 'YOUR_WEATHERAPI_KEY_HERE') {
      return res.json({
        success: true,
        weather: {
          temp: 28,
          condition: 'Partly Cloudy',
          humidity: 75,
          wind: 12,
          location: 'Rubber Plantation',
          icon: '//cdn.weatherapi.com/weather/64x64/day/116.png'
        },
        forecast: [
          { day: 'Mon', temp: 29, icon: '☀️', condition: 'Sunny' },
          { day: 'Tue', temp: 27, icon: '⛅', condition: 'Partly Cloudy' },
          { day: 'Wed', temp: 25, icon: '🌧️', condition: 'Rain' },
          { day: 'Thu', temp: 26, icon: '⛅', condition: 'Partly Cloudy' },
          { day: 'Fri', temp: 30, icon: '☀️', condition: 'Sunny' }
        ]
      });
    }

    // Get weather from WeatherAPI
    const location = '6.25,118.70'; // Default plantation coordinates
    
    const [currentResponse, forecastResponse] = await Promise.all([
      axios.get(`https://api.weatherapi.com/v1/current.json?key=${WEATHER_API_KEY}&q=${location}&aqi=no`),
      axios.get(`https://api.weatherapi.com/v1/forecast.json?key=${WEATHER_API_KEY}&q=${location}&days=5&aqi=no`)
    ]);
    
    const weatherData = {
      temp: currentResponse.data.current.temp_c,
      condition: currentResponse.data.current.condition.text,
      humidity: currentResponse.data.current.humidity,
      wind: currentResponse.data.current.wind_kph,
      location: currentResponse.data.location.name,
      icon: currentResponse.data.current.condition.icon
    };

    const forecast = forecastResponse.data.forecast.forecastday.map(day => {
      const date = new Date(day.date);
      return {
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        temp: day.day.avgtemp_c,
        icon: getWeatherIcon(day.day.condition.code),
        condition: day.day.condition.text
      };
    });

    res.json({
      success: true,
      weather: weatherData,
      forecast: forecast
    });
  } catch (error) {
    console.error('Weather API error:', error.message);
    
    // Return mock data on error
    res.json({
      success: true,
      weather: {
        temp: 28,
        condition: 'Partly Cloudy',
        humidity: 75,
        wind: 12,
        location: 'Rubber Plantation',
        icon: '//cdn.weatherapi.com/weather/64x64/day/116.png'
      },
      forecast: [
        { day: 'Mon', temp: 29, icon: '☀️', condition: 'Sunny' },
        { day: 'Tue', temp: 27, icon: '⛅', condition: 'Partly Cloudy' },
        { day: 'Wed', temp: 25, icon: '🌧️', condition: 'Rain' },
        { day: 'Thu', temp: 26, icon: '⛅', condition: 'Partly Cloudy' },
        { day: 'Fri', temp: 30, icon: '☀️', condition: 'Sunny' }
      ]
    });
  }
});

// Helper function to map WeatherAPI codes to emoji icons
function getWeatherIcon(code) {
  const iconMap = {
    1000: '☀️', // Sunny
    1003: '⛅', // Partly cloudy
    1006: '☁️', // Cloudy
    1009: '☁️', // Overcast
    1030: '🌫️', // Mist
    1063: '🌦️', // Patchy rain possible
    1066: '🌨️', // Patchy snow possible
    1069: '🌨️', // Patchy sleet possible
    1072: '🌨️', // Patchy freezing drizzle possible
    1087: '⛈️', // Thundery outbreaks possible
    1114: '🌨️', // Blowing snow
    1117: '❄️', // Blizzard
    1135: '🌫️', // Fog
    1147: '🌫️', // Freezing fog
    1150: '🌦️', // Patchy light drizzle
    1153: '🌦️', // Light drizzle
    1168: '🌨️', // Freezing drizzle
    1171: '🌨️', // Heavy freezing drizzle
    1180: '🌦️', // Patchy light rain
    1183: '🌧️', // Light rain
    1186: '🌧️', // Moderate rain at times
    1189: '🌧️', // Moderate rain
    1192: '🌧️', // Heavy rain at times
    1195: '🌧️', // Heavy rain
    1198: '🌨️', // Light freezing rain
    1201: '🌨️', // Moderate or heavy freezing rain
    1204: '🌨️', // Light sleet
    1207: '🌨️', // Moderate or heavy sleet
    1210: '🌨️', // Patchy light snow
    1213: '🌨️', // Light snow
    1216: '❄️', // Patchy moderate snow
    1219: '❄️', // Moderate snow
    1222: '❄️', // Patchy heavy snow
    1225: '❄️', // Heavy snow
    1237: '🧊', // Ice pellets
    1240: '🌦️', // Light rain shower
    1243: '🌧️', // Moderate or heavy rain shower
    1246: '🌧️', // Torrential rain shower
    1249: '🌨️', // Light sleet showers
    1252: '🌨️', // Moderate or heavy sleet showers
    1255: '🌨️', // Light snow showers
    1258: '❄️', // Moderate or heavy snow showers
    1261: '🧊', // Light showers of ice pellets
    1264: '🧊', // Moderate or heavy showers of ice pellets
    1273: '⛈️', // Patchy light rain with thunder
    1276: '⛈️', // Moderate or heavy rain with thunder
    1279: '⛈️', // Patchy light snow with thunder
    1282: '⛈️'  // Moderate or heavy snow with thunder
  };
  
  return iconMap[code] || '⛅';
}

module.exports = router;