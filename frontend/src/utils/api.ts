import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL + '/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auth APIs
export const sendOTP = (phone: string) => 
  api.post('/auth/send-otp', { phone });

export const verifyOTP = (phone: string, otp: string) => 
  api.post('/auth/verify-otp', { phone, otp });

export const updateUser = (userId: string, data: any) => 
  api.put(`/users/${userId}`, data);

// Shop APIs
export const getShops = (params?: any) => 
  api.get('/shops', { params });

export const getShop = (shopId: string) => 
  api.get(`/shops/${shopId}`);

export const createShop = (data: any) => 
  api.post('/shops', data);

// Product APIs
export const getProducts = (params?: any) => 
  api.get('/products', { params });

export const getProduct = (productId: string) => 
  api.get(`/products/${productId}`);

// Order APIs
export const createOrder = (data: any) => 
  api.post('/orders', data);

export const getOrders = (params?: any) => 
  api.get('/orders', { params });

export const getOrder = (orderId: string) => 
  api.get(`/orders/${orderId}`);

export const updateOrderStatus = (orderId: string, status: string) => 
  api.put(`/orders/${orderId}/status`, { status });

// Utility APIs
export const getVillages = () => 
  api.get('/villages');

export const getCategories = () => 
  api.get('/categories');

export default api;