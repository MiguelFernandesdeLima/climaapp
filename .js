// Configurações da API
const API_KEY = '7cd10524632c2051a908e2e208491291'; 
const BASE_URL = 'https://api.openweathermap.org/data/2.5/';
const ICON_URL = 'https://openweathermap.org/img/wn/';

// Elementos DOM
const cityInput = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
const locationBtn = document.getElementById('location-btn');
const errorMessage = document.getElementById('error-message');
const loading = document.getElementById('loading');
const weatherCard = document.getElementById('weather-card');

// Elementos de exibição do tempo
const cityName = document.getElementById('city-name');
const currentDate = document.getElementById('current-date');
const currentTemp = document.getElementById('current-temp');
const weatherIcon = document.getElementById('weather-icon');
const weatherDesc = document.getElementById('weather-description');
const feelsLike = document.getElementById('feels-like');
const humidity = document.getElementById('humidity');
const windSpeed = document.getElementById('wind-speed');
const pressure = document.getElementById('pressure');
const forecastContainer = document.getElementById('forecast');
const celsiusBtn = document.getElementById('celsius-btn');
const fahrenheitBtn = document.getElementById('fahrenheit-btn');

// Variáveis globais
let currentUnit = 'celsius';
let weatherData = null;

// Event Listeners
searchBtn.addEventListener('click', () => {
    const city = cityInput.value.trim();
    if (city) {
        getWeatherData(city);
    } else {
        showError('Por favor, digite o nome de uma cidade');
    }
});

locationBtn.addEventListener('click', getLocationWeather);

cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const city = cityInput.value.trim();
        if (city) {
            getWeatherData(city);
        }
    }
});

celsiusBtn.addEventListener('click', () => {
    if (currentUnit !== 'celsius') {
        currentUnit = 'celsius';
        celsiusBtn.classList.add('active');
        fahrenheitBtn.classList.remove('active');
        updateWeatherDisplay();
    }
});

fahrenheitBtn.addEventListener('click', () => {
    if (currentUnit !== 'fahrenheit') {
        currentUnit = 'fahrenheit';
        fahrenheitBtn.classList.add('active');
        celsiusBtn.classList.remove('active');
        updateWeatherDisplay();
    }
});

// Função principal para buscar dados do tempo
async function getWeatherData(city) {
    try {
        showLoading(true);
        clearError();
        
        // Busca dados atuais
        const currentResponse = await fetch(`${BASE_URL}weather?q=${city}&units=metric&lang=pt_br&appid=${API_KEY}`);
        
        if (!currentResponse.ok) {
            throw new Error('Cidade não encontrada');
        }
        
        const currentData = await currentResponse.json();
        
        // Busca previsão para 5 dias
        const forecastResponse = await fetch(`${BASE_URL}forecast?q=${city}&units=metric&lang=pt_br&appid=${API_KEY}`);
        const forecastData = await forecastResponse.json();
        
        weatherData = {
            current: currentData,
            forecast: forecastData
        };
        
        updateWeatherDisplay();
        showLoading(false);
    } catch (error) {
        showLoading(false);
        showError(error.message || 'Erro ao buscar dados do tempo');
        console.error('Error fetching weather data:', error);
    }
}

// Busca tempo pela localização do usuário
function getLocationWeather() {
    if (navigator.geolocation) {
        showLoading(true);
        clearError();
        
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const { latitude, longitude } = position.coords;
                    
                    // Busca dados atuais
                    const currentResponse = await fetch(`${BASE_URL}weather?lat=${latitude}&lon=${longitude}&units=metric&lang=pt_br&appid=${API_KEY}`);
                    const currentData = await currentResponse.json();
                    
                    // Busca previsão para 5 dias
                    const forecastResponse = await fetch(`${BASE_URL}forecast?lat=${latitude}&lon=${longitude}&units=metric&lang=pt_br&appid=${API_KEY}`);
                    const forecastData = await forecastResponse.json();
                    
                    weatherData = {
                        current: currentData,
                        forecast: forecastData
                    };
                    
                    updateWeatherDisplay();
                    showLoading(false);
                } catch (error) {
                    showLoading(false);
                    showError('Erro ao buscar dados de localização');
                    console.error('Error fetching location weather:', error);
                }
            },
            (error) => {
                showLoading(false);
                showError('Não foi possível acessar sua localização');
                console.error('Geolocation error:', error);
            }
        );
    } else {
        showError('Geolocalização não suportada pelo seu navegador');
    }
}

// Atualiza a exibição com os dados do tempo
function updateWeatherDisplay() {
    if (!weatherData) return;
    
    const { current, forecast } = weatherData;
    
    // Dados atuais
    cityName.textContent = `${current.name}, ${current.sys.country}`;
    
    const now = new Date();
    currentDate.textContent = now.toLocaleDateString('pt-BR', { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long',
        year: 'numeric'
    });
    
    const temp = currentUnit === 'celsius' 
        ? Math.round(current.main.temp) 
        : Math.round((current.main.temp * 9/5) + 32);
    currentTemp.textContent = temp;
    
    const iconCode = current.weather[0].icon;
    weatherIcon.innerHTML = `<img src="${ICON_URL}${iconCode}@2x.png" alt="${current.weather[0].description}">`;
    
    weatherDesc.textContent = current.weather[0].description;
    
    // Detalhes
    const feelsLikeTemp = currentUnit === 'celsius'
        ? Math.round(current.main.feels_like)
        : Math.round((current.main.feels_like * 9/5) + 32);
    feelsLike.textContent = `${feelsLikeTemp}°${currentUnit === 'celsius' ? 'C' : 'F'}`;
    
    humidity.textContent = `${current.main.humidity}%`;
    
    const wind = currentUnit === 'celsius'
        ? `${(current.wind.speed * 3.6).toFixed(1)} km/h`
        : `${current.wind.speed.toFixed(1)} mph`;
    windSpeed.textContent = wind;
    
    pressure.textContent = `${current.main.pressure} hPa`;
    
    // Previsão para 5 dias
    updateForecastDisplay(forecast);
}

// Atualiza a previsão para 5 dias
function updateForecastDisplay(forecastData) {
    forecastContainer.innerHTML = '';
    
    // Agrupa por dia (a API retorna dados a cada 3 horas)
    const dailyForecast = {};
    forecastData.list.forEach(item => {
        const date = new Date(item.dt * 1000).toLocaleDateString('pt-BR');
        
        if (!dailyForecast[date]) {
            dailyForecast[date] = {
                temps: [],
                icons: [],
                descriptions: []
            };
        }
        
        dailyForecast[date].temps.push(item.main.temp);
        dailyForecast[date].icons.push(item.weather[0].icon);
        dailyForecast[date].descriptions.push(item.weather[0].description);
    });
    
    // Pega os próximos 5 dias (excluindo hoje)
    const forecastDates = Object.keys(dailyForecast).slice(1, 6);
    
    forecastDates.forEach(date => {
        const dayData = dailyForecast[date];
        const dayTemps = dayData.temps;
        const maxTemp = currentUnit === 'celsius'
            ? Math.round(Math.max(...dayTemps))
            : Math.round((Math.max(...dayTemps) * 9/5) + 32);
        const minTemp = currentUnit === 'celsius'
            ? Math.round(Math.min(...dayTemps))
            : Math.round((Math.min(...dayTemps) * 9/5) + 32);
        
        // Pega o ícone mais frequente do dia
        const iconCounts = {};
        dayData.icons.forEach(icon => {
            iconCounts[icon] = (iconCounts[icon] || 0) + 1;
        });
        const mostFrequentIcon = Object.keys(iconCounts).reduce((a, b) => 
            iconCounts[a] > iconCounts[b] ? a : b
        );
        
        // Pega a descrição mais frequente
        const descCounts = {};
        dayData.descriptions.forEach(desc => {
            descCounts[desc] = (descCounts[desc] || 0) + 1;
        });
        const mostFrequentDesc = Object.keys(descCounts).reduce((a, b) => 
            descCounts[a] > descCounts[b] ? a : b
        );
        
        // Cria o elemento do dia
        const dayElement = document.createElement('div');
        dayElement.className = 'forecast-day';
        
        const dateObj = new Date(date);
        const weekday = dateObj.toLocaleDateString('pt-BR', { weekday: 'short' });
        
        dayElement.innerHTML = `
            <h3>${weekday}</h3>
            <div class="forecast-icon">
                <img src="${ICON_URL}${mostFrequentIcon}.png" alt="${mostFrequentDesc}">
            </div>
            <div class="forecast-temp">
                <span class="max-temp">${maxTemp}°</span>
                <span class="min-temp">${minTemp}°</span>
            </div>
        `;
        
        forecastContainer.appendChild(dayElement);
    });
}

// Mostra/oculta o spinner de carregamento
function showLoading(show) {
    if (show) {
        loading.classList.add('active');
    } else {
        loading.classList.remove('active');
    }
}

// Mostra mensagem de erro
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.add('show');
    
    // Remove a mensagem após 5 segundos
    setTimeout(clearError, 5000);
}

// Limpa mensagem de erro
function clearError() {
    errorMessage.classList.remove('show');
}

// Inicializa o app com uma cidade padrão
function init() {
    getWeatherData('São Paulo');
}

// Inicia o aplicativo
init();
cityInput.focus();

//Para evitar multiplas chamadas da API 
let timeoutId;
cityInput.addEventListener('input', () => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
        if (cityInput.value.trim()) getWeatherData(cityInput.value.trim());
    }, 500);
});