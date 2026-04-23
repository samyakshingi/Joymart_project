import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:8000' : 'https://joymart-project.onrender.com');

const api = axios.create({
  baseURL: API_URL,
});

export default api;
