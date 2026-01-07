import axios from 'axios';

// Replace with your computer's local IP or 10.0.2.2 for Android Emulator
// localhost might not work on Android device/emulator
const API_URL = 'http://10.0.2.2:3000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export default api;
