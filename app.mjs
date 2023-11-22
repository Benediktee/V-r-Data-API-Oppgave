
import fetch from "node-fetch";


if (process.argv.length < 4) {
    console.log("Usage: app.mjs <place> <county> [--full].");
    process.exit();
}


const place = process.argv[2].trim();
const county = process.argv[3].trim();
const showFull = process.argv.includes("--full");

const baseURL = "https://www.yr.no/api/v0/"
const searchLocationUrl = `${baseURL}locations/Search?q=${place}&county=${county}&accuracy=1000&language=nn`;



const locationData = await fetchData(searchLocationUrl);



const DAYS = ["Søndag ", "Mandag ", "Tirsdag", "Onsdag ", "Torsdag", "Fredag ", "Lørdag "];
const ALLMONTHS = ["Januar", "Februar", "Mars", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Desember"];


const today = new Date().getDay();
const date = new Date().getDate();
const month = new Date().getMonth();

const startDayIndex = DAYS.indexOf(DAYS[today]);
const startMonthIndex = ALLMONTHS.indexOf(ALLMONTHS[month]);

let correctMonth = `${ALLMONTHS[month]}`;
let correctDate = `${date}. ${correctMonth}`;

console.log(correctMonth);




if (locationData && locationData.totalResults > 0) {
    const location = locationData._embedded.location[0]; 
    const townID = location.id; 

    
    const foreCastUrl = `${baseURL}locations/${townID}/forecast`;
    const vaerData = await fetchData(foreCastUrl);

    const celestialUrl = `${baseURL}locations/${townID}/celestialevents`;
    const celestialData = await fetchData(celestialUrl);



    for (let index = 0; index < vaerData.dayIntervals.length; index++) {
        let output = "🌞";
        let dag = vaerData.dayIntervals[index];


        if (dag.twentyFourHourSymbol === "rain") {
            output = "🌧️";
        } else if (dag.twentyFourHourSymbol.indexOf("cloud") != -1) {
            output = "☁️";
        } else if (dag.twentyFourHourSymbol === "snow") {
            output = "❄️";
        } else if (dag.twentyFourHourSymbol === "sun") {
            output = "☀️";
        } else if (dag.twentyFourHourSymbol === "lightrain") {
            output = "🌦️";
        } else if (dag.twentyFourHourSymbol === "lightsnow") {
            output = "🌨️";
        } else if (dag.twentyFourHourSymbol === "lightrainshowers_day") {
            output = "🌦️";
        } else if (dag.twentyFourHourSymbol === "rainandthunder") {
            output = "🌩️";
        }


        const sunriseEvent = celestialData.events.find(event => event.type === "Rise" && event.body === "Sun");
        const sunsetEvent = celestialData.events.find(event => event.type === "Set" && event.body === "Sun");

        const sunriseTime = sunriseEvent ? new Date(sunriseEvent.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : 'N/A';
        const sunsetTime = sunsetEvent ? new Date(sunsetEvent.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : 'N/A';


        let displayDate = date + index;
        if (displayDate > 30) {
            displayDate -= 30;
        }

        let displayDayIndex = startDayIndex + index;
        if (displayDayIndex >= DAYS.length) {
            displayDayIndex -= DAYS.length;
        }

        const rainMm = dag.precipitation ? ` 💧  ${dag.precipitation.value} mm` : '';

        const windDescription = dag.wind ? getWind(dag.wind.max) : "N/A";


    for (let index = 0; index < vaerData.dayIntervals.length; index++) {
        if (showFull) {
            const prettierOutput = `${DAYS[displayDayIndex]} ${displayDate} ${output.padEnd(10)}${getDetailedWeather(dag.twentyFourHourSymbol).padEnd(20)} ${rainMm.padEnd(15)}${dag.temperature ? `🌡️    ${dag.temperature.min}/${dag.temperature.max} C.`.padEnd(25) : ''}${dag.wind ? `🌬️    ${dag.wind.min}/${dag.wind.max}.` : ''}  ${windDescription.padEnd(15)} 🌅 ${sunriseTime.padEnd(10)}   🌆 ${sunsetTime.padEnd(10)}`;
            console.log(prettierOutput);
        } else {
            const onlyOneDay = vaerData.dayIntervals[0];
            const simpleWeatherSummary = `${DAYS[displayDayIndex]} ${displayDate}: ${getSimpleWeatherSummary(dag.twentyFourHourSymbol)}`;
            console.log(simpleWeatherSummary);
        }

        break;
    }
}


} else {

    console.log(`Kunne ikke finne: ${place}.`)
}





function getDetailedWeather(symbol) {
    switch (symbol) {
        case "clearsky_day":
            return "Klar Himmel";
        case "lightrain":
            return "Lett Regn";
        case "partlycloudy_night":
            return "Delevis skyet";
        case "partlycloudy_day":
            return "Delevis skyet";
        case "cloudy":
            return "Skyet";
        case "fair_day":
            return "Pent vær";
        case "lightsleet":
            return "Lett sludd";
        case "sleet":
            return "Sludd";
        case "snow":
            return "Snø";
        case "lightsnow":
            return "Lett snø"
        case "lightrainshowers_day":
            return "Lett regn"
        case "rainandthunder":
            return "Regn og torden";
        case "rain":
            return "Regn";

        default:
            return symbol;
    }
}

function getWind(windSpeed) {
    if (windSpeed >= 0 && windSpeed < 1.6) {
        return "Stille.."
    } else if (windSpeed >= 1.6 && windSpeed < 3.4) {
        return "Ikke mye vind..";
    } else if (windSpeed >= 3.4 && windSpeed < 5.5) {
        return "Lett bris";
    } else if (windSpeed >= 5.5 && windSpeed < 8.0) {
        return "Svak bris";
    } else if (windSpeed >= 8.0 && windSpeed < 10.8) {
        return "Frisk bris";
    } else if (windSpeed >= 10.8 && windSpeed < 13.9) {
        return "Liten kuling";
    } else if (windSpeed >= 13.9 && windSpeed < 17.2) {
        return "Stiv kuling";
    } else if (windSpeed >= 17.2 && windSpeed < 20.8) {
        return "Sterk kuling!"
    } else if (windSpeed >= 20.8 && windSpeed < 24.5) {
        return "Liten storm!";
    } else if (windSpeed >= 24.5 && windSpeed < 28.5) {
        return "Storm!";
    } else if (windSpeed >= 28.5) {
        return "Full storm!";
    } else {
        return "Usikker vindforhold.";
    }
}

function getSimpleWeatherSummary(symbol) {
    switch (symbol) {
        case "rain":
            return "Ta med en paraply! ☔";
        case "snow":
            return "Ta på varme klær! 🥶";
        case "sun":
            return "Du må ta på solkrem! 😎";
    default:
        return "Varierende værforhold!";
    }
}


async function fetchData(url) {
    const rawData = await fetch(url);
    return await rawData.json();
}