const API_BASE = "http://localhost:3001/api/weather/";

const cityForm = document.getElementById("city-form");
const cityInput = document.getElementById("city-input");
const formError = document.getElementById("form-error");
const currentSection = document.getElementById("current-weather-section");
const forecastSection = document.getElementById("forecast-section");

const cityNameEl = document.getElementById("city-name");
const weatherDescEl = document.getElementById("weather-desc");
const weatherTempEl = document.getElementById("weather-temp");
const weatherUnitEl = document.getElementById("weather-unit");
const weatherIconEl = document.getElementById("weather-icon");
const weatherHumidityEl = document.getElementById("weather-humidity");
const weatherWindEl = document.getElementById("weather-wind");
const weatherFeelsEl = document.getElementById("weather-feels");
const weatherUvEl = document.getElementById("weather-uv");
const forecastCards = document.getElementById("forecast-cards");

cityForm.addEventListener("submit", async e => {
  e.preventDefault();
  const city = cityInput.value.trim();
  if (!city) return showError("Please enter a city name.");
  showError("");
  await loadWeather(city);
});

async function loadWeather(city) {
  showLoading(true);
  try {
    const [current, forecast] = await Promise.all([
      fetch(API_BASE + "current?city=" + encodeURIComponent(city)).then(r => r.json()),
      fetch(API_BASE + "forecast?city=" + encodeURIComponent(city)).then(r => r.json())
    ]);
    if (current.error) return showError(current.error);
    if (forecast.error) return showError(forecast.error);
    showCurrentWeather(current);
    showForecast(forecast.forecast);
  } catch (err) {
    showError("Could not load weather. Try again.");
  }
  showLoading(false);
}

function showError(msg) {
  formError.textContent = msg;
  formError.hidden = !msg;
}

function showLoading(isLoading) {
  cityForm.querySelector("button[type='submit']").disabled = isLoading;
}

function showCurrentWeather(data) {
  currentSection.hidden = false;
  cityNameEl.textContent = `${data.city}, ${data.country}`;
  weatherDescEl.textContent = `${capitalize(data.weather.main)} (${data.weather.description})`;
  weatherTempEl.textContent = Math.round(data.weather.temp);
  weatherUnitEl.textContent = "°C";
  weatherIconEl.src = `https://openweathermap.org/img/wn/${data.weather.icon}@2x.png`;
  weatherIconEl.alt = data.weather.description;
  weatherIconEl.classList.remove("animate");
  setTimeout(() => weatherIconEl.classList.add("animate"), 140);
  weatherHumidityEl.textContent = data.weather.humidity;
  weatherWindEl.textContent = data.weather.wind;
  weatherFeelsEl.textContent = Math.round(data.weather.feels_like);
  weatherUvEl.textContent = data.weather.uv !== null ? data.weather.uv : "N/A";
}

function showForecast(forecastArr) {
  forecastSection.hidden = false;
  forecastCards.innerHTML = "";
  forecastArr.slice(0, 5).forEach((day, idx) => {
    const card = document.createElement("div");
    card.className = "col card shadow-sm";
    card.style.maxWidth = "210px";
    card.tabIndex = 0;
    card.setAttribute("aria-label", `Weather for ${formatDate(day.date)}`);
    card.innerHTML = `
      <div class="card-body text-center">
        <div><img src="https://openweathermap.org/img/wn/${day.icon}@2x.png" alt="${day.description}" width="60" height="60"></div>
        <div class="fw-bold fs-5 mb-1">${formatDate(day.date)}</div>
        <div class="mb-1">${capitalize(day.main)}</div>
        <div class="fs-4 mb-1">${Math.round(day.temp)}°C</div>
        <div class="weather-accordion accordion" id="accordion-${idx}">
          <div class="accordion-item">
            <h2 class="accordion-header" id="heading-${idx}">
              <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse-${idx}" aria-expanded="false" aria-controls="collapse-${idx}">
                Details
              </button>
            </h2>
            <div id="collapse-${idx}" class="accordion-collapse collapse" aria-labelledby="heading-${idx}" data-bs-parent="#accordion-${idx}">
              <div class="accordion-body">
                <ul class="mb-0">
                  <li><strong>Humidity:</strong> ${day.humidity}%</li>
                  <li><strong>Wind:</strong> ${day.wind} km/h</li>
                  <li><strong>Description:</strong> ${capitalize(day.description)}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    forecastCards.appendChild(card);
  });
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, {weekday: 'short', month: 'short', day: 'numeric'});
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
