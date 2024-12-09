
const API = "89f310115498307013f3cdfedd72f600";

const dayEl = document.querySelector(".default_day");
const dateEl = document.querySelector(".default_date");
const btnEl = document.querySelector(".btn_search");
const inputEl = document.querySelector(".input_field");

const iconsContainer = document.querySelector(".icons");
const dayInfoEl = document.querySelector(".day_info");
const listContentEl = document.querySelector(".list_content ul");
const imgSection = document.querySelector(".img_section");

const days = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

// Display current day and date
const day = new Date();
const dayName = days[day.getDay()];
dayEl.textContent = dayName;
let month = day.toLocaleString("default", { month: "long" });
let date = day.getDate();
let year = day.getFullYear();
dateEl.textContent = `${date} ${month} ${year}`;

// Loading spinner
const showLoading = () => {
  iconsContainer.innerHTML = '<div class="spinner"></div>';
};

const hideLoading = () => {
  const spinner = iconsContainer.querySelector(".spinner");
  if (spinner) spinner.remove();
};

// current location on page load
window.addEventListener("load", () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        console.log("Geolocation success:", { lat, lon });
        showLoading();
        getWeatherByCoordinates(lat, lon);
      },
      (error) => {
        console.error("Geolocation error:", error);
        handleGeolocationError(error);
      }
    );
  } else {
    alert("Geolocation is not supported by this browser.");
  }
});

// geolocation errors
const handleGeolocationError = (error) => {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      alert("Location access denied. Please allow location access in your browser settings.");
      break;
    case error.POSITION_UNAVAILABLE:
      alert("Location information is unavailable.");
      break;
    case error.TIMEOUT:
      alert("The request to get your location timed out. Please try again.");
      break;
    default:
      alert("An unknown error occurred while retrieving location.");
  }
};

// Get weather by city name 
btnEl.addEventListener("click", (e) => {
  e.preventDefault();
  if (inputEl.value !== "") {
    const city = inputEl.value;
    inputEl.value = "";
    showLoading();
    getWeatherByCity(city);
  } else {
    alert("Please enter a city name.");
  }
});

async function getWeatherByCity(city) {
  const API_URL = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API}`;
  await fetchWeatherData(API_URL);
}

async function getWeatherByCoordinates(lat, lon) {
  const API_URL = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API}`;
  await fetchWeatherData(API_URL);
}

// weather data from API
async function fetchWeatherData(API_URL) {
  iconsContainer.innerHTML = "";
  dayInfoEl.innerHTML = "";
  listContentEl.innerHTML = "";

  try {
    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const result = await response.json();

    if (result.cod === 200) {
      setWeatherBackground(result.weather[0].main);
      const imageContent = displayImageContent(result);
      const rightSideContent = displayRightSideContent(result);
      displayForeCast(result.coord.lat, result.coord.lon);

      setTimeout(() => {
        iconsContainer.insertAdjacentHTML("afterbegin", imageContent);
        iconsContainer.classList.add("fadeIn");
        dayInfoEl.insertAdjacentHTML("afterbegin", rightSideContent);
        hideLoading();
      }, 1500);
    } else {
      handleAPIError(result);
    }
  } catch (error) {
    console.error("Error fetching weather data:", error);
    hideLoading();
    alert("Failed to fetch weather data. Please try again later.");
  }
}

// API errors
function handleAPIError(result) {
  iconsContainer.insertAdjacentHTML(
    "afterbegin",
    `<h2 class="weather_temp">${result.cod}</h2>
    <h3 class="cloudtxt">${result.message}</h3>`
  );
}

// background image based on weather condition
function setWeatherBackground(condition) {
  const weatherImages = {
    Clear: "clear.jpg",
    Clouds: "clouds.jpg",
    Rain: "rain.jpg",
    Snow: "snow.jpg",
    Thunderstorm: "thunderstorm.jpg",
    Drizzle: "Drizzle.jpg",
    Mist: "foggy.jpg",
    Fog: "foggy.jpg",
    Haze: "foggy.jpg",
  };

  const imageUrl = `url('./image/${weatherImages[condition] || "default.jpg"}')`;
  imgSection.style.backgroundImage = imageUrl;
}

// image content and temperature
function displayImageContent(data) {
  return `<img src="https://openweathermap.org/img/wn/${
    data.weather[0].icon
  }@4x.png" alt="" />
    <h2 class="weather_temp">${Math.round(data.main.temp - 273.15)}°C</h2>
    <h3 class="cloudtxt">${data.weather[0].description}</h3>`;
}

// right side content
function displayRightSideContent(result) {
  return `<div class="content">
          <p class="title">NAME</p>
          <span class="value">${result.name}</span>
        </div>
        <div class="content">
          <p class="title">TEMP</p>
          <span class="value">${Math.round(result.main.temp - 273.15)}°C</span>
        </div>
        <div class="content">
          <p class="title">HUMIDITY</p>
          <span class="value">${result.main.humidity}%</span>
        </div>
        <div class="content">
          <p class="title">WIND SPEED</p>
          <span class="value">${result.wind.speed} Km/h</span>
        </div>`;
}

// Forecast display 
async function displayForeCast(lat, lon) {
  const FORECAST_API = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API}`;
  try {
    const response = await fetch(FORECAST_API);
    const result = await response.json();

    const uniqueForecastDays = [];
    const daysForecast = result.list.filter((forecast) => {
      const forecastDate = new Date(forecast.dt_txt).getDate();
      if (!uniqueForecastDays.includes(forecastDate)) {
        uniqueForecastDays.push(forecastDate);
        return true;
      }
      return false;
    });

    daysForecast.slice(0, 4).forEach((content) => {
      listContentEl.insertAdjacentHTML("beforeend", generateForecastHTML(content));
    });
  } catch (error) {
    console.error("Error fetching forecast data:", error);
  }
}

// Forecast HTML element
function generateForecastHTML(frContent) {
  const day = new Date(frContent.dt_txt);
  const dayName = days[day.getDay()].slice(0, 3);
  return `<li>
    <img src="https://openweathermap.org/img/wn/${frContent.weather[0].icon}@2x.png" />
    <span>${dayName}</span>
    <span class="day_temp">${Math.round(frContent.main.temp - 273.15)}°C</span>
  </li>`;
}
