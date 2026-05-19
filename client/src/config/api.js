// src/config/apiConfig.js

export const API_BASE_URL = import.meta.env.PROD
    ? '' // Same-origin in production (Express serves the bundle)
    : 'http://localhost:8080';
