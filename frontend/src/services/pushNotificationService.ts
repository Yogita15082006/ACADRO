import { getToken } from 'firebase/messaging';
import { messaging } from '../lib/firebase';
import api from './api';

const API_URL = '/v1/notifications';

export const pushNotificationService = {
  
  async requestPermissionAndRegister(): Promise<boolean> {
    try {
      console.log('[FCM] Firebase initialized');
      if (!('Notification' in window)) {
        console.warn('This browser does not support desktop notification');
        return false;
      }

      if (Notification.permission === 'granted') {
        console.log('[FCM] Notification permission: already granted');
        await this.registerToken();
        return true;
      }

      if (Notification.permission !== 'denied') {
        console.log('[FCM] Requesting notification permission...');
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          console.log('[FCM] Notification permission: granted');
          await this.registerToken();
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('[FCM] Error requesting notification permission:', error);
      return false;
    }
  },

  async registerToken() {
    if (!messaging) {
      console.error('[FCM] Messaging not initialized. Missing environment variables?');
      return;
    }
    
    try {
      console.log('[FCM] Waiting for service worker...');
      // Use the Vite PWA managed service worker registration
      const registration = await navigator.serviceWorker.ready;
      console.log('[FCM] Service worker ready. Generating token...');
      
      const token = await getToken(messaging, { 
        vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
        serviceWorkerRegistration: registration 
      });

      if (token) {
        console.log('[FCM] FCM token generated');
        await this.sendTokenToBackend(token);
      } else {
        console.warn('[FCM] No registration token available. Request permission to generate one.');
      }
    } catch (err) {
      console.error('[FCM] An error occurred while retrieving token. ', err);
    }
  },

  async sendTokenToBackend(token: string) {
    try {
      console.log('[FCM] Registering device token with backend');
      await api.post(`${API_URL}/device-token?token=${encodeURIComponent(token)}`);
      
      // Store token locally so we know we've registered it
      localStorage.setItem('fcm_token', token);
      console.log('[FCM] Device token registered successfully');
    } catch (error) {
      console.error('[FCM] Failed to send token to backend:', error);
    }
  },

  async unregisterToken() {
    try {
      const token = localStorage.getItem('fcm_token');
      if (!token) return;

      await api.delete(`${API_URL}/device-token?token=${encodeURIComponent(token)}`);
      
      localStorage.removeItem('fcm_token');
    } catch (error) {
      console.error('Failed to unregister token:', error);
    }
  }
};
