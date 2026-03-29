// Extended API functions for delivery partners
import api from './api';

// Delivery Partner APIs
export const createDeliveryPartner = (data: any) => 
  api.post('/delivery-partners', data);

export const getDeliveryPartner = (userId: string) => 
  api.get(`/delivery-partners/${userId}`);

export const updateDeliveryPartner = (userId: string, data: any) => 
  api.put(`/delivery-partners/${userId}`, data);

export const getAvailableOrders = (userId: string, lat?: number, lng?: number) => 
  api.get(`/delivery-partners/user/${userId}/available-orders`, { params: { lat, lng } });

export const assignOrderToPartner = (orderId: string, partnerId: string) => 
  api.put(`/orders/${orderId}/assign`, { delivery_partner_id: partnerId });

export const updatePartnerLocation = (userId: string, location: { lat: number; lng: number }) => 
  api.put(`/delivery-partners/${userId}/location`, location);

export const getPartnerEarnings = (userId: string, period?: string) => 
  api.get(`/delivery-partners/${userId}/earnings`, { params: { period } });

export const requestPayout = (userId: string, amount: number) => 
  api.post(`/delivery-partners/${userId}/payout-request`, { amount });