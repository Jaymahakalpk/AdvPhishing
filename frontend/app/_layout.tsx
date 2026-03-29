import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { useAuthStore } from '../src/store/authStore';
import { useCartStore } from '../src/store/cartStore';

export default function RootLayout() {
  const loadUser = useAuthStore((state) => state.loadUser);
  const loadCart = useCartStore((state) => state.loadCart);

  useEffect(() => {
    loadUser();
    loadCart();
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