import axios from 'axios';

export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.161.158.60:8000';

export const api = axios.create({
  baseURL: API_URL,
});
