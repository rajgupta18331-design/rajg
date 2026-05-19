const API_KEY = '30242601b7c183182b23171719dcdb7a';
const BASE_URL = 'https://api.openweathermap.org/data/2.5/weather';
const FORECAST_URL = 'https://api.openweathermap.org/data/2.5/forecast';

const cityInput = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
const locationBtn = document.getElementById('location-btn');
const weatherContent = document.getElementById('weather-content');
const loader = document.getElementById('loader');
const errorMsg = document.getElementById('error-msg');
const bgOverlay = document.getElementById('bg-overlay');
const forecastContainer = document.getElementById('forecast-container');

// UI Elements
const cityNameEl = document.getElementById('city-name');
const dateEl = document.getElementById('current-date');
const tempEl = document.getElementById('temperature');
const descEl = document.getElementById('description');
const feelsLikeEl = document.getElementById('feels-like');
const humidityEl = document.getElementById('humidity');
const windEl = document.getElementById('wind-speed');
const pressureEl = document.getElementById('pressure');
const visibilityEl = document.getElementById('visibility');
const cloudsEl = document.getElementById('clouds');
const sunriseEl = document.getElementById('sunrise');
const sunsetEl = document.getElementById('sunset');
const weatherIconLarge = document.getElementById('weather-icon-large');

let tempChart = null;

const weatherIcons = {
    'Clear': 'sun',
    'Clouds': 'cloud',
    'Rain': 'cloud-rain',
    'Drizzle': 'cloud-drizzle',
    'Thunderstorm': 'cloud-lightning',
    'Snow': 'snowflake',
    'Mist': 'cloud-fog',
    'Smoke': 'cloud-fog',
    'Haze': 'cloud-fog',
    'Dust': 'cloud-fog',
    'Fog': 'cloud-fog',
    'Sand': 'cloud-fog',
    'Ash': 'cloud-fog',
    'Squall': 'wind',
    'Tornado': 'tornado'
};

const bgGradients = {
    'Clear': 'radial-gradient(circle at top right, #38bdf8, #0ea5e9)',
    'Clouds': 'radial-gradient(circle at top right, #94a3b8, #475569)',
    'Rain': 'radial-gradient(circle at top right, #64748b, #1e293b)',
    'Snow': 'radial-gradient(circle at top right, #e2e8f0, #94a3b8)',
    'Thunderstorm': 'radial-gradient(circle at top right, #1e293b, #020617)',
    'Default': 'radial-gradient(circle at top right, #1e293b, #0f172a)'
};

async function fetchWeather(city) {
    showLoading();
    try {
        const [weatherRes, forecastRes] = await Promise.all([
            fetch(`${BASE_URL}?q=${city}&appid=${API_KEY}&units=metric`),
            fetch(`${FORECAST_URL}?q=${city}&appid=${API_KEY}&units=metric`)
        ]);

        if (!weatherRes.ok || !forecastRes.ok) throw new Error('Data not found');

        const weatherData = await weatherRes.json();
        const forecastData = await forecastRes.json();

        updateUI(weatherData);
        updateForecast(forecastData);
        updateChart(forecastData);
    } catch (error) {
        showError();
    }
}

async function fetchWeatherByCoords(lat, lon) {
    showLoading();
    try {
        const [weatherRes, forecastRes] = await Promise.all([
            fetch(`${BASE_URL}?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`),
            fetch(`${FORECAST_URL}?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`)
        ]);

        if (!weatherRes.ok || !forecastRes.ok) throw new Error('Data not found');

        const weatherData = await weatherRes.json();
        const forecastData = await forecastRes.json();

        updateUI(weatherData);
        updateForecast(forecastData);
        updateChart(forecastData);
    } catch (error) {
        showError();
    }
}

function updateUI(data) {
    const { name, main, weather, wind, dt, sys, visibility, clouds } = data;
    const condition = weather[0].main;
    
    cityNameEl.textContent = `${name}, ${sys.country}`;
    
    const date = new Date(dt * 1000);
    const options = { weekday: 'long', day: 'numeric', month: 'long' };
    dateEl.textContent = date.toLocaleDateString('en-US', options);
    
    tempEl.textContent = Math.round(main.temp);
    descEl.textContent = weather[0].description;
    feelsLikeEl.textContent = `${Math.round(main.feels_like)}°C`;
    humidityEl.textContent = `${main.humidity}%`;
    windEl.textContent = `${Math.round(wind.speed * 3.6)} km/h`;
    pressureEl.textContent = `${main.pressure} hPa`;
    visibilityEl.textContent = `${(visibility / 1000).toFixed(1)} km`;
    cloudsEl.textContent = `${clouds.all}%`;
    
    const formatTime = (time) => new Date(time * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    sunriseEl.textContent = formatTime(sys.sunrise);
    sunsetEl.textContent = formatTime(sys.sunset);
    
    // Update Icon
    const iconName = weatherIcons[condition] || 'cloud-sun';
    weatherIconLarge.setAttribute('data-lucide', iconName);
    lucide.createIcons();
    
    // Update Background
    bgOverlay.style.background = bgGradients[condition] || bgGradients['Default'];
    
    hideLoading();
}

function updateForecast(data) {
    forecastContainer.innerHTML = '';
    // Filter to get one forecast per day (around noon)
    const dailyForecasts = data.list.filter(item => item.dt_txt.includes('12:00:00'));
    
    dailyForecasts.forEach(day => {
        const date = new Date(day.dt * 1000);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        const condition = day.weather[0].main;
        const iconName = weatherIcons[condition] || 'cloud';
        
        const forecastItem = document.createElement('div');
        forecastItem.className = 'forecast-item';
        forecastItem.innerHTML = `
            <span class="forecast-day">${dayName}</span>
            <i data-lucide="${iconName}" class="forecast-icon"></i>
            <span class="forecast-temp">${Math.round(day.main.temp)}°C</span>
        `;
        forecastContainer.appendChild(forecastItem);
    });
    lucide.createIcons();
}

function updateChart(data) {
    const ctx = document.getElementById('tempChart').getContext('2d');
    const labels = data.list.slice(0, 8).map(item => {
        return new Date(item.dt * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    });
    const temps = data.list.slice(0, 8).map(item => item.main.temp);

    if (tempChart) tempChart.destroy();

    tempChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Temperature Trend (°C)',
                data: temps,
                borderColor: '#38bdf8',
                backgroundColor: 'rgba(56, 189, 248, 0.1)',
                fill: true,
                tension: 0.4,
                borderWidth: 3,
                pointRadius: 4,
                pointBackgroundColor: '#38bdf8'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    ticks: { color: '#94a3b8' }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#94a3b8' }
                }
            }
        }
    });
}

function showLoading() {
    loader.classList.remove('hidden');
    weatherContent.classList.add('hidden');
    errorMsg.classList.add('hidden');
}

function hideLoading() {
    loader.classList.add('hidden');
    weatherContent.classList.remove('hidden');
}

function showError() {
    loader.classList.add('hidden');
    weatherContent.classList.add('hidden');
    errorMsg.classList.remove('hidden');
}

searchBtn.addEventListener('click', () => {
    const city = cityInput.value.trim();
    if (city) fetchWeather(city);
});

locationBtn.addEventListener('click', () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
            const { latitude, longitude } = position.coords;
            fetchWeatherByCoords(latitude, longitude);
        }, () => {
            alert('Unable to retrieve your location. Please check permissions.');
        });
    } else {
        alert('Geolocation is not supported by your browser.');
    }
});

cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const city = cityInput.value.trim();
        if (city) fetchWeather(city);
    }
});

// Initial fetch
fetchWeather('London');
