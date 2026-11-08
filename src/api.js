import axios from 'axios';

const apiUrl = import.meta.env.VITE_API_URL;

if (!apiUrl) {
    throw new Error('VITE_API_URL must be configured before starting the frontend.');
}

const api = axios.create({
    baseURL: `${apiUrl.replace(/\/+$/, '')}/api`,
    timeout: 20000,
});

// Dùng để dựng URL tuyệt đối cho file tĩnh backend trả về (/uploads/...).
export const API_ORIGIN = apiUrl.replace(/\/+$/, '');

export default api;
