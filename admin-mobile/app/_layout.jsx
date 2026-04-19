import { Slot, useRouter, usePathname } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Platform, StatusBar } from 'react-native';
import { useEffect, useState } from 'react';
import { api } from '../api';

const queryClient = new QueryClient();

export default function Layout() {
  const router = useRouter();
  const pathname = usePathname();
  const [isStoreOpen, setIsStoreOpen] = useState(true);

  useEffect(() => {
    const fetchStatus = () => {
      api.get('/store/status')
        .then(res => setIsStoreOpen(res.data.is_open))
        .catch(err => console.error(err));
    };
    fetchStatus();
  }, []);

  const toggleStoreStatus = async () => {
    try {
      const res = await api.put(`/store/status?is_open=${!isStoreOpen}`);
      setIsStoreOpen(res.data.is_open);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <Text style={styles.logoText}>JoyMart Admin</Text>
              <TouchableOpacity 
                style={[styles.statusBtn, isStoreOpen ? styles.statusOpen : styles.statusClosed]}
                onPress={toggleStoreStatus}
              >
                <Text style={[styles.statusBtnText, isStoreOpen ? styles.textOpen : styles.textClosed]}>
                  {isStoreOpen ? '🟢 OPEN' : '🔴 CLOSED'}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.tabsContainer}>
              <TouchableOpacity 
                style={[styles.tab, pathname === '/' && styles.activeTab]} 
                onPress={() => router.push('/')}
              >
                <Text style={[styles.tabText, pathname === '/' && styles.activeTabText]}>Live Orders</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.tab, pathname === '/catalog' && styles.activeTab]} 
                onPress={() => router.push('/catalog')}
              >
                <Text style={[styles.tabText, pathname === '/catalog' && styles.activeTabText]}>Catalog</Text>
              </TouchableOpacity>
            </View>
          </View>
          <Slot />
        </View>
      </SafeAreaView>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0f172a',
  },
  statusBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
  },
  statusOpen: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
  },
  statusClosed: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  statusBtnText: {
    fontWeight: 'bold',
    fontSize: 12,
  },
  textOpen: { color: '#047857' },
  textClosed: { color: '#b91c1c' },
  tabsContainer: {
    flexDirection: 'row',
    gap: 24,
  },
  tab: {
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderColor: 'transparent',
  },
  activeTab: {
    borderColor: '#10b981',
  },
  tabText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#64748b',
  },
  activeTabText: {
    color: '#10b981',
  }
});
