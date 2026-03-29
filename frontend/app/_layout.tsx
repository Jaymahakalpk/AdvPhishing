import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { useAuthStore } from '../src/store/authStore';
import { useCartStore } from '../src/store/cartStore';

export default function RootLayout() {
  const loadUser = useAuthStore((state) => state.loadUser);
  const loadCart = useCartStore((state) => state.loadCart);

  useEffect(() => {
    // Load user and cart data with a small delay to ensure AsyncStorage is ready
    const initializeApp = async () => {
      try {
        await loadUser();
        await loadCart();
      } catch (error) {
        console.error('Error initializing app:', error);
      }
    };
    
    // Small delay to ensure native modules are ready
    const timer = setTimeout(() => {
      initializeApp();
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="shop/[id]" />
      <Stack.Screen name="checkout" />
    </Stack>
  );
}