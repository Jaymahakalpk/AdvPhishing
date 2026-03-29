import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface CartItem {
  product_id: string;
  product_name: string;
  price: number;
  quantity: number;
  shop_id: string;
  shop_name: string;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (product_id: string) => void;
  updateQuantity: (product_id: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  loadCart: () => Promise<void>;
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  addItem: async (item) => {
    const items = get().items;
    const existingItem = items.find(i => i.product_id === item.product_id);
    
    let newItems;
    if (existingItem) {
      newItems = items.map(i => 
        i.product_id === item.product_id 
          ? { ...i, quantity: i.quantity + item.quantity }
          : i
      );
    } else {
      newItems = [...items, item];
    }
    
    await AsyncStorage.setItem('cart', JSON.stringify(newItems));
    set({ items: newItems });
  },
  removeItem: async (product_id) => {
    const items = get().items;
    const newItems = items.filter(i => i.product_id !== product_id);
    await AsyncStorage.setItem('cart', JSON.stringify(newItems));
    set({ items: newItems });
  },
  updateQuantity: async (product_id, quantity) => {
    const items = get().items;
    const newItems = items.map(i => 
      i.product_id === product_id ? { ...i, quantity } : i
    );
    await AsyncStorage.setItem('cart', JSON.stringify(newItems));
    set({ items: newItems });
  },
  clearCart: async () => {
    await AsyncStorage.removeItem('cart');
    set({ items: [] });
  },
  getTotal: () => {
    const items = get().items;
    return items.reduce((total, item) => total + (item.price * item.quantity), 0);
  },
  loadCart: async () => {
    try {
      const cartData = await AsyncStorage.getItem('cart');
      if (cartData) {
        set({ items: JSON.parse(cartData) });
      }
    } catch (error) {
      console.error('Error loading cart:', error);
    }
  },
}));