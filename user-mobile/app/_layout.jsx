import { Slot, useRouter, usePathname } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useStore } from '../store';
import { useEffect, useState } from 'react';
import { api } from '../api';

const queryClient = new QueryClient();

export default function Layout() {
  const router = useRouter();
  const pathname = usePathname();
  const cart = useStore((state) => state.cart);
  const [isStoreOpen, setIsStoreOpen] = useState(true);

  useEffect(() => {
    const fetchStatus = () => {
      api.get('/store/status')
        .then(res => setIsStoreOpen(res.data.is_open))
        .catch(err => console.error(err));
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const user = useStore(state => state.user);

  useEffect(() => {
    if (!user.phone && pathname !== '/login' && pathname !== '/privacy' && pathname !== '/terms' && pathname !== '/about') {
      router.replace('/login');
    }
  }, [user.phone, pathname]);

  const cartTotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <QueryClientProvider client={queryClient}>
      <View style={styles.container}>
        {!isStoreOpen && (
          <View style={styles.banner}>
            <Text style={styles.bannerText}>⚠️ STORE IS CURRENTLY CLOSED. WE ARE NOT ACCEPTING NEW ORDERS. ⚠️</Text>
          </View>
        )}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.push('/')} style={styles.logoContainer}>
            <Text style={styles.logoText}>JoyMart</Text>
          </TouchableOpacity>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={() => router.push('/tracking')} style={styles.trackButton}>
              <Text style={styles.trackText}>Track Order</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/checkout')} style={styles.cartButton}>
              <Text style={styles.cartText}>₹{cartTotal.toFixed(0)}</Text>
              {cartCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{cartCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
        <Slot />
      </View>

    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  banner: {
    backgroundColor: '#dc2626',
    padding: 10,
    alignItems: 'center',
    zIndex: 60,
  },
  bannerText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 50, // for safe area roughly
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    zIndex: 50,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0f172a',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  trackButton: {
    padding: 8,
  },
  trackText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#64748b',
  },
  cartButton: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  cartText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#ef4444',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#0f172a',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
  },
  footerLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 32,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    backgroundColor: '#fff',
  },
  footerLinkText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#94a3b8',
  },
  footerDot: {
    fontSize: 12,
    color: '#cbd5e1',
  }
});
