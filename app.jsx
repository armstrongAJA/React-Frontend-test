import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import { initAuth0, login, logout, getAccessToken, updateUI } from "./auth.js";

const initialLatLong = ["53.8008", "-1.5491"];

function WeatherApp() {
  const [location, setLocation] = useState("Leeds");
  const [lat, setLat] = useState(initialLatLong[0]);
  const [lon, setLon] = useState(initialLatLong[1]);
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const getLatLong = async (loc) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?city=${loc}&country=united%20kingdom&format=json`
      );
      const result = await res.json();
      if (!result[0]) throw new Error("No results");
      return [parseFloat(result[0].lat), parseFloat(result[0].lon)];
    } catch {
      return [null, null];
    }
  };

  const buildApiUrl = () =>
    `https://weatherapp-3o2e.onrender.com/weather?lat=${lat}&lon=${lon}&LOCATION=${location}`;

  const fetchWeatherData = async (token) => {
    try {
      const res = await fetch(buildApiUrl(), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Fetch failed");
      return await res.json();
    } catch {
      alert("Failed to load weather data");
      return null;
    }
  };

  const initWeather = async (token) => {
    setLoading(true);
    const [latitude, longitude] = await getLatLong(location);
    if (!latitude || !longitude) {
      alert("Failed to get coordinates");
      setLoading(false);
      return;
    }
    setLat(latitude);
    setLon(longitude);
    const data = await fetchWeatherData(token);
    setWeatherData(data);
    setLoading(false);
  };

  useEffect(() => {
    (async () => {
      const auth = await initAuth0();
      setIsAuthenticated(auth);
      await updateUI();
      if (auth) {
        const token = getAccessToken();
        if (token) await initWeather(token);
      }
    })();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      const token = getAccessToken();
      if (token) initWeather(token);
    }
  }, [location]);

  return (
    <div>
      <header>
        <h1>7-Day Weather Forecast ({location})</h1>
        <button id="login-btn" onClick={login}>Login</button>
        <button id="logout-btn" onClick={logout}>Logout</button>
        <select value={location} onChange={(e) => setLocation(e.target.value)}>
          <option value="Leeds">Leeds</option>
          <option value="London">London</option>
          <option value="Manchester">Manchester</option>
        </select>
      </header>

      {loading ? (
        <p>Loading...</p>
      ) : weatherData ? (
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Max Temp (°C)</th>
              <th>Weather</th>
            </tr>
          </thead>
          <tbody>
            {weatherData.data_day.time.map((time, i) => (
              <tr key={i}>
                <td>{formatDate(time)}</td>
                <td>{weatherData.data_day.temperature_max[i].toFixed(1)}</td>
                <td>Weather info</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </div>
  );
}

ReactDOM.render(<WeatherApp />, document.getElementById("root"));
