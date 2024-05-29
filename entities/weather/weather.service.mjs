import axios from "axios";

// Replace 'YOUR_OPENWEATHERMAP_API_KEY' with your actual OpenWeatherMap API key
const openWeatherMapApiKey = process.env.WEATHER_API_KEY;

export const WeatherService = {
  getWeather: async function getWeather({ latitude, longitude }) {
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
            exclude: ["current", "minutely", "hourly"],
          },
        }
      );

      // const temperature = weatherData.main.temp;
      // const description = weatherData.weather[0].description;

      return response.data;
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
