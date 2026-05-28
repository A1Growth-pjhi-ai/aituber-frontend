// API関連の処理
import { OPENWEATHER_API_KEY, DEFAULT_CITY, NEWS_API_KEY } from './config.js';

// Get weather information
export async function getWeather(city) {
    try {
        const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${OPENWEATHER_API_KEY}&units=metric&lang=ja`);
        const data = await response.json();
        
        if (data.cod === 200) {
            return {
                city: data.name,
                temp: Math.round(data.main.temp),
                description: data.weather[0].description,
                humidity: data.main.humidity
            };
        }
        return null;
    } catch (error) {
        console.error('Weather API error:', error);
        return null;
    }
}

// Get Japan news
export async function getJapanNews() {
    try {
        const response = await fetch(`https://newsapi.org/v2/top-headlines?country=jp&apiKey=${NEWS_API_KEY}&pageSize=5`);
        const data = await response.json();
        
        if (data.status === 'ok' && data.articles && data.articles.length > 0) {
            const randomArticle = data.articles[Math.floor(Math.random() * data.articles.length)];
            return {
                title: randomArticle.title,
                description: randomArticle.description || '',
                source: randomArticle.source.name
            };
        }
        return null;
    } catch (error) {
        console.error('News API error:', error);
        return null;
    }
}

// Get random trivia
export async function getTrivia() {
    try {
        const response = await fetch('https://uselessfacts.jsph.pl/random.json?language=en');
        const data = await response.json();
        
        if (data.text) {
            return {
                text: data.text
            };
        }
        return null;
    } catch (error) {
        console.error('Trivia API error:', error);
        return null;
    }
}

// Detect city name in message
export function detectCity(message) {
    const cities = ['Tokyo', 'Osaka', 'Kyoto', 'Yokohama', 'Nagoya', 'Sapporo', 'Fukuoka', 'Kobe', 'Sendai', 'Hiroshima'];
    const cityMap = {
        '東京': 'Tokyo', 'とうきょう': 'Tokyo',
        '大阪': 'Osaka', 'おおさか': 'Osaka',
        '京都': 'Kyoto', 'きょうと': 'Kyoto',
        '横浜': 'Yokohama', 'よこはま': 'Yokohama',
        '名古屋': 'Nagoya', 'なごや': 'Nagoya',
        '札幌': 'Sapporo', 'さっぽろ': 'Sapporo',
        '福岡': 'Fukuoka', 'ふくおか': 'Fukuoka',
        '神戸': 'Kobe', 'こうべ': 'Kobe',
        '仙台': 'Sendai', 'せんだい': 'Sendai',
        '広島': 'Hiroshima', 'ひろしま': 'Hiroshima'
    };
    
    // Check Japanese city names
    for (const [jpName, enName] of Object.entries(cityMap)) {
        if (message.includes(jpName)) {
            return enName;
        }
    }
    
    // Check English city names
    for (const city of cities) {
        if (message.toLowerCase().includes(city.toLowerCase())) {
            return city;
        }
    }
    
    return null;
}
