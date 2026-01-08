// Replace with your computer's local IP or 10.0.2.2 for Android Emulator
// localhost might not work on Android device/emulator
const API_URL = 'http://10.0.2.2:3000/api';

const api = {
    get: async (endpoint: string) => {
        try {
            const response = await fetch(`${API_URL}${endpoint}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            const data = await response.json();
            return { data, status: response.status };
        } catch (error) {
            throw error;
        }
    },
    post: async (endpoint: string, body: any) => {
        try {
            const response = await fetch(`${API_URL}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            });
            const data = await response.json();
            return { data, status: response.status };
        } catch (error) {
            throw error;
        }
    }
};

export default api;
