import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { useAuthStore } from '../src/store/authStore';
import { useCartStore } from '../src/store/cartStore';

export default function RootLayout() {
  const loadUser = useAuthStore((state) => state.loadUser);
  const loadCart = useCartStore((state) => state.loadCart);

  useEffect(() => {
    // Load user and cart data with error handling
    const initializeApp = async () => {
      try {
        await loadUser();
      } catch (error) {
        console.log('User load error (non-critical):', error);
      }
      
      try {
        await loadCart();
      } catch (error) {
        console.log('Cart load error (non-critical):', error);
      }
    };
    
    initializeApp();
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(partner-tabs)" />
      <Stack.Screen name="shop/[id]" />
      <Stack.Screen name="checkout" />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}