import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

export const useStore = create(
  persist(
    (set, get) => ({
      cart: [],
      user: {
        name: '',
        phone: '',
        flat_number: '',
        society_id: '',
      },
      addToCart: (product) => set((state) => {
        const existing = state.cart.find(item => item.product.id === product.id);
        if (existing) {
          if (existing.quantity >= product.stock_count) {
            Alert.alert('Out of Stock', `Only ${product.stock_count} ${product.name}(s) available in stock!`);
            return { cart: state.cart };
          }
          return {
            cart: state.cart.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item)
          };
        }
        if (product.stock_count <= 0) {
          Alert.alert('Out of Stock', `${product.name} is out of stock!`);
          return { cart: state.cart };
        }
        return { cart: [...state.cart, { product, quantity: 1 }] };
      }),
      decreaseQuantity: (productId) => set((state) => {
        const existing = state.cart.find(item => item.product.id === productId);
        if (existing && existing.quantity > 1) {
          return {
            cart: state.cart.map(item => item.product.id === productId ? { ...item, quantity: item.quantity - 1 } : item)
          };
        }
        return { cart: state.cart.filter(item => item.product.id !== productId) };
      }),
      removeFromCart: (productId) => set((state) => ({
        cart: state.cart.filter(item => item.product.id !== productId)
      })),
      clearCart: () => set({ cart: [] }),
      setUser: (userData) => set({ user: { ...get().user, ...userData } }),
    }),
    {
      name: 'joymart-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
