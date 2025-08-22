const { useState, useEffect } = React;
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
    return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
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
      const auth = await window.initAuth0();
      setIsAuthenticated(auth);
      await window.updateUI();
      if (auth) {
        const token = window.getAccessToken();
        if (token) await initWeather(token);
      }
    })();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      const token = window.getAccessToken();
      if (token) initWeather(token);
    }
  }, [location]);

  return React.createElement(
    "div",
    null,
    React.createElement(
      "header",
      null,
      React.createElement("h1", null, `7-Day Weather Forecast (${location})`),
      React.createElement("button", { onClick: window.login }, "Login"),
      React.createElement("button", { onClick: window.logout }, "Logout"),
      React.createElement(
        "select",
        { value: location, onChange: (e) => setLocation(e.target.value) },
        React.createElement("option", { value: "Leeds" }, "Leeds"),
        React.createElement("option", { value: "London" }, "London"),
        React.createElement("option", { value: "Manchester" }, "Manchester")
      )
    ),
    loading
      ? React.createElement("p", null, "Loading...")
      : weatherData &&
        React.createElement(
          "table",
          null,
          React.createElement(
            "thead",
            null,
            React.createElement(
              "tr",
              null,
              React.createElement("th", null, "Date"),
              React.createElement("th", null, "Max Temp (°C)"),
              React.createElement("th", null, "Weather")
            )
          ),
          React.createElement(
            "tbody",
            null,
            weatherData.data_day.time.map((time, i) =>
              React.createElement(
                "tr",
                { key: i },
                React.createElement("td", null, formatDate(time)),
                React.createElement(
                  "td",
                  null,
                  weatherData.data_day.temperature_max[i].toFixed(1)
                ),
                React.createElement("td", null, "Weather info")
              )
            )
          )
        )
  );
}

ReactDOM.render(React.createElement(WeatherApp), document.getElementById("root"));
