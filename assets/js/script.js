const API_URL = 'https://api.sunrise-sunset.org/json';
const TIMEZONE_API_URL = 'http://worldtimeapi.org/api/timezone/'; // World Time API endpoint
const locationSelect = document.getElementById('locationSelect');
const currentLocationBtn = document.getElementById('currentLocationBtn');
const loading = document.getElementById('loading');
const dataDisplay = document.getElementById('dataDisplay');
const cityImage = document.getElementById('cityImage');
const themeToggleBtn = document.getElementById('themeToggleBtn');
const body = document.body;

// City images map
const cityImages = {
    "New York, NY": "assets/img/new_york.jpg.avif",
    "Los Angeles, CA": "assets/img/los_angeles.jpg.avif",
    "Chicago, IL": "assets/img/chicago.jpg.avif",
    "Houston, TX": "assets/img/houston.jpg.jpg",
    "Phoenix, AZ": "assets/img/phoenix.jpg.jpg",
    "Denver, CO": "assets/img/denver.jpg.jpeg",
    "Seattle, WA": "assets/img/seattle.jpg.jpeg",
    "Washington, D.C.": "assets/img/washington_dc.jpg.jpeg",
    "San Diego, CA": "assets/img/san_diego.jpg.jpeg",
    "Madison, WI": "assets/img/madison.jpg.jpeg"
};

// Locations list (latitude and longitude for each city)
const locations = [
    { name: 'New York, NY', lat: 40.7128, lng: -74.006 },
    { name: 'Los Angeles, CA', lat: 34.0522, lng: -118.2437 },
    { name: 'Chicago, IL', lat: 41.8781, lng: -87.6298 },
    { name: 'Houston, TX', lat: 29.7604, lng: -95.3698 },
    { name: 'Phoenix, AZ', lat: 33.4484, lng: -112.0740 },
    { name: 'Denver, CO', lat: 39.7392, lng: -104.9903 },
    { name: 'Seattle, WA', lat: 47.6062, lng: -122.3321 },
    { name: 'Washington, D.C.', lat: 51.5074, lng: -0.1278 },
    { name: 'San Diego, CA', lat: 32.7157, lng: -117.1611 },
    { name: 'Madison, WI', lat: 43.0731, lng: -89.4012 }
];

// Populate location dropdown
locations.forEach(loc => {
    const option = document.createElement('option');
    option.value = `${loc.lat},${loc.lng}`;
    option.textContent = loc.name;
    option.setAttribute('data-city', loc.name);  // Add city name as data attribute
    locationSelect.appendChild(option);
});

// Toggle light/dark theme
themeToggleBtn.addEventListener('click', () => {
    body.classList.toggle('light-mode');
    if (body.classList.contains('light-mode')) {
        themeToggleBtn.textContent = "Switch to Dark Theme";
    } else {
        themeToggleBtn.textContent = "Switch to Light Theme";
    }
});


// Function to set city data (dropdown, image)
function setCityData(cityName, lat, lng) {
    // Set the city in the dropdown
    const option = document.querySelector(`#locationSelect option[data-city='${cityName}']`);
    locationSelect.value = `${lat},${lng}`;
    locationSelect.dispatchEvent(new Event('change')); // Update the displayed value in the dropdown

    // Set the city image
    if (cityImages[cityName]) {
        cityImage.src = cityImages[cityName];
        cityImage.style.display = 'block';  // Show the image
    } else {
        cityImage.style.display = 'none';  // Hide the image if not found
    }
}
// Event Listener for Current Location Button
currentLocationBtn.addEventListener('click', () => {
    navigator.geolocation.getCurrentPosition(
        async (pos) => {
            const { latitude, longitude } = pos.coords;

            // Find the closest city to the user's current location
            const closestCity = locations.reduce((closest, city) => {
                const distance = Math.sqrt(
                    Math.pow(city.lat - latitude, 2) + Math.pow(city.lng - longitude, 2)
                );
                if (!closest || distance < closest.distance) {
                    return { city, distance };
                }
                return closest;
            }, null);

            if (closestCity) {
                // Set the closest city data (dropdown and city image)
                setCityData(closestCity.city.name, closestCity.city.lat, closestCity.city.lng);
            }
        },
        (err) => {
            alert('Location permission denied!');
        }
    );
});

// Helper function to convert seconds to hh:mm:ss
function formatDayLength(seconds) {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs}h ${mins}m ${secs}s`;
}

// Helper function to fetch UTC offset from World Time API based on lat/lng
async function getTimeZoneOffset(lat, lng) {
    try {
        // Construct a URL using latitude and longitude to fetch timezone information
        const response = await fetch(`${TIMEZONE_API_URL}Etc/GMT`);
        const data = await response.json();

        if (!data || !data.utc_offset) {
            return 'UTC Offset Not Available';
        }

        const offset = data.utc_offset; // UTC offset in format +hh:mm or -hh:mm
        return offset;
    } catch (error) {
        console.error('Error fetching time zone:', error);
        return 'UTC Offset Error';
    }
}

// Fetch data function
async function fetchSunData(lat, lng) {
    try {
        loading.classList.remove('hidden');
        dataDisplay.classList.add('hidden');

        // Get today's date and tomorrow's date
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);

        // Format dates to API-compatible format (YYYY-MM-DD)
        const todayDate = today.toISOString().split('T')[0];
        const tomorrowDate = tomorrow.toISOString().split('T')[0];

        // Fetch data for today and tomorrow
        const todayResponse = await fetch(`${API_URL}?lat=${lat}&lng=${lng}&date=${todayDate}&formatted=0`);
        const tomorrowResponse = await fetch(`${API_URL}?lat=${lat}&lng=${lng}&date=${tomorrowDate}&formatted=0`);

        const todayData = await todayResponse.json();
        const tomorrowData = await tomorrowResponse.json();

        if (todayData.status !== 'OK' || tomorrowData.status !== 'OK') throw new Error('API Error');

        // Get the UTC offset using the sunrise time for today
        const timeZoneOffset = await getTimeZoneOffset(lat, lng);
        document.getElementById('todayTimeZone').textContent = timeZoneOffset;
        document.getElementById('tomorrowTimeZone').textContent = timeZoneOffset;

        // Display today's data
        const todayResults = todayData.results;
        document.getElementById('todaySunrise').textContent = formatDate(todayResults.sunrise);
        document.getElementById('todaySunset').textContent = formatDate(todayResults.sunset);
        document.getElementById('todayDawn').textContent = todayResults.civil_twilight_begin ? formatDate(todayResults.civil_twilight_begin) : 'N/A';
        document.getElementById('todayDusk').textContent = todayResults.civil_twilight_end ? formatDate(todayResults.civil_twilight_end) : 'N/A';
        document.getElementById('todayLength').textContent = formatDayLength(todayResults.day_length);
        document.getElementById('todaySolarNoon').textContent = formatDate(todayResults.solar_noon);

        // Display tomorrow's data
        const tomorrowResults = tomorrowData.results;
        document.getElementById('tomorrowSunrise').textContent = formatDate(tomorrowResults.sunrise);
        document.getElementById('tomorrowSunset').textContent = formatDate(tomorrowResults.sunset);
        document.getElementById('tomorrowDawn').textContent = tomorrowResults.civil_twilight_begin ? formatDate(tomorrowResults.civil_twilight_begin) : 'N/A';
        document.getElementById('tomorrowDusk').textContent = tomorrowResults.civil_twilight_end ? formatDate(tomorrowResults.civil_twilight_end) : 'N/A';
        document.getElementById('tomorrowLength').textContent = formatDayLength(tomorrowResults.day_length);
        document.getElementById('tomorrowSolarNoon').textContent = formatDate(tomorrowResults.solar_noon);

        // Show data
        dataDisplay.classList.remove('hidden');

        // Show the city image based on selection
        const selectedCity = locationSelect.options[locationSelect.selectedIndex].dataset.city;
        if (cityImages[selectedCity]) {
            cityImage.src = cityImages[selectedCity];
            cityImage.style.display = 'block';  // Show the image
        } else {
            cityImage.style.display = 'none';  // Hide the image if not found
        }

    } catch (error) {
        alert('Error fetching data: ' + error.message);
    } finally {
        loading.classList.add('hidden');
    }
}

// Helper function to format date to local time
function formatDate(utcDate) {
    if (!utcDate) return 'N/A';
    const date = new Date(utcDate);
    return date.toLocaleTimeString(); // Convert UTC to local time
}

// Event Listeners for Location Selection
locationSelect.addEventListener('change', e => {
    const selectedCity = e.target.value;
    if (selectedCity) {
        const [lat, lng] = selectedCity.split(',');
        fetchSunData(lat, lng);  // Fetch the data for the selected location
    } else {
        dataDisplay.classList.add('hidden'); // Hide the data if no location is selected
    }
});

// Event Listeners for Location Selection
locationSelect.addEventListener('change', e => {
    const [lat, lng] = e.target.value.split(',');
    fetchSunData(lat, lng);  // Fetch the data for the selected location
});
