import axios from "axios";

// Replace 'YOUR_OPENWEATHERMAP_API_KEY' with your actual OpenWeatherMap API key
const openWeatherMapApiKey = process.env.WEATHER_API_KEY;

export const WeatherService = {
  getWeather: async function ({ latitude, longitude }) {
    try {
      // Make a request to the OpenWeatherMap API to get the weather data
      const response = await axios.get(
        // "https://api.openweathermap.org/data/3.0/weather",
        "https://api.openweathermap.org/data/3.0/onecall",

        {
          params: {
            lat: latitude,
            lon: longitude,
            appid: openWeatherMapApiKey,
            units: "metric",
            exclude: ["current", "hourly", "daily"],
          },
        }
      );

      // For daily remove the decimals of all the fields
      const weatherData = response.data;
      delete weatherData.hourly;
      delete weatherData.minutely;

      Object.keys(weatherData.current).forEach((key) => {
        if (typeof weatherData.current[key] === "number") {
          weatherData.current[key] = Math.floor(weatherData.current[key]);
        }
      });
      weatherData.daily.forEach((day) => {
        Object.keys(day).forEach((key) => {
          if (typeof day[key] === "number") {
            day[key] = Math.floor(day[key]);
          }
        });
      });

      return weatherData;
    } catch (error) {
      console.error("Error fetching weather data:", error);
    }
  },

  getLocationFromCoordinates: async function getLocationFromCoordinates({
    latitude,
    longitude,
  }) {
    const response = await axios.get(
      "http://api.openweathermap.org/geo/1.0/reverse",
      {
        params: {
          lat: latitude,
          lon: longitude,
          appid: openWeatherMapApiKey,
          limit: 1,
        },
      }
    );
    return response.data[0];
  },
};
