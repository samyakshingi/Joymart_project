import { Slot, useRouter, usePathname, useSegments } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Platform, StatusBar, ScrollView, Linking } from 'react-native';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../api';

const queryClient = new QueryClient();

const APP_VERSION = "1.0.0";
const PLATFORM = Platform.OS;

export default function Layout() {
  const router = useRouter();
  const pathname = usePathname();
  const segments = useSegments();
  
  const [isStoreOpen, setIsStoreOpen] = useState(true);
  const [adminRole, setAdminRole] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const phone = await AsyncStorage.getItem('joymart_admin_phone');
      const role = await AsyncStorage.getItem('joymart_admin_role');
      if (phone && role) {
        setAdminRole(role);
        // Force route to Rider dashboard if Rider
        if (role === 'Rider' && pathname !== '/deliveries') {
           router.replace('/deliveries');
        }
      } else {
        setAdminRole(null);
        if (pathname !== '/login') {
          router.replace('/login');
        }
      }
      setAuthChecked(true);
    };
    checkAuth();
  }, [segments]);

  const [forceUpdate, setForceUpdate] = useState(false);

  useEffect(() => {
    api.get(`/system/version-check?platform=${PLATFORM}&current_version=${APP_VERSION}`)
      .then(res => setForceUpdate(res.data.force_update))
      .catch(err => console.error('Version check failed', err));
  }, []);

  if (forceUpdate) {
    return (
      <View style={styles.forceUpdateContainer}>
        <View style={styles.forceUpdateCard}>
          <Text style={styles.forceUpdateTitle}>Update Required</Text>
          <Text style={styles.forceUpdateSubtitle}>A critical update is required to continue using JoyMart.</Text>
          <TouchableOpacity style={styles.updateBtn} onPress={() => Linking.openURL('https://store.joymart.com')}>
            <Text style={styles.updateBtnText}>Update Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  useEffect(() => {
    if (adminRole === 'Admin') {
      const fetchStatus = () => {
        api.get('/store/status')
          .then(res => setIsStoreOpen(res.data.is_open))
          .catch(err => console.error(err));
      };
      fetchStatus();
    }
  }, [adminRole]);

  const toggleStoreStatus = async () => {
    try {
      const res = await api.put(`/store/status?is_open=${!isStoreOpen}`);
      setIsStoreOpen(res.data.is_open);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('joymart_admin_phone');
    await AsyncStorage.removeItem('joymart_admin_role');
    setAdminRole(null);
    router.replace('/login');
  };

  if (!authChecked) return null;

  // If we are on the login screen, hide the nav layout
  if (pathname === '/login') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Slot />
      </SafeAreaView>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <View>
                <Text style={styles.logoText}>JoyMart</Text>
                <Text style={styles.roleText}>{adminRole || 'Portal'}</Text>
              </View>
              <View style={styles.headerRight}>
                {adminRole === 'Admin' && (
                  <TouchableOpacity 
                    style={[styles.statusBtn, isStoreOpen ? styles.statusOpen : styles.statusClosed]}
                    onPress={toggleStoreStatus}
                  >
                    <Text style={[styles.statusBtnText, isStoreOpen ? styles.textOpen : styles.textClosed]}>
                      {isStoreOpen ? '🟢 OPEN' : '🔴 CLOSED'}
                    </Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
                  <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollTabs}>
              <View style={styles.tabsContainer}>
                {adminRole === 'Rider' && (
                  <TouchableOpacity 
                    style={[styles.tab, pathname === '/deliveries' && styles.activeTab]} 
                    onPress={() => router.push('/deliveries')}
                  >
                    <Text style={[styles.tabText, pathname === '/deliveries' && styles.activeTabText]}>My Deliveries</Text>
                  </TouchableOpacity>
                )}

                {adminRole === 'Admin' && (
                  <>
                    <TouchableOpacity style={[styles.tab, pathname === '/' && styles.activeTab]} onPress={() => router.push('/')}>
                      <Text style={[styles.tabText, pathname === '/' && styles.activeTabText]}>Live Orders</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.tab, pathname === '/catalog' && styles.activeTab]} onPress={() => router.push('/catalog')}>
                      <Text style={[styles.tabText, pathname === '/catalog' && styles.activeTabText]}>Catalog</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.tab, pathname === '/coupons' && styles.activeTab]} onPress={() => router.push('/coupons')}>
                      <Text style={[styles.tabText, pathname === '/coupons' && styles.activeTabText]}>Coupons</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.tab, pathname === '/accounts' && styles.activeTab]} onPress={() => router.push('/accounts')}>
                      <Text style={[styles.tabText, pathname === '/accounts' && styles.activeTabText]}>Khata</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.tab, pathname === '/reconciliation' && styles.activeTab]} onPress={() => router.push('/reconciliation')}>
                      <Text style={[styles.tabText, pathname === '/reconciliation' && styles.activeTabText]}>Audit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.tab, pathname === '/banners' && styles.activeTab]} onPress={() => router.push('/banners')}>
                      <Text style={[styles.tabText, pathname === '/banners' && styles.activeTabText]}>Banners</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.tab, pathname === '/wallet' && styles.activeTab]} onPress={() => router.push('/wallet')}>
                      <Text style={[styles.tabText, pathname === '/wallet' && styles.activeTabText]}>Wallet</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.tab, pathname === '/customers' && styles.activeTab]} onPress={() => router.push('/customers')}>
                      <Text style={[styles.tabText, pathname === '/customers' && styles.activeTabText]}>Customers</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </ScrollView>
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0f172a',
  },
  roleText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#10b981',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  statusBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
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
    fontSize: 10,
  },
  textOpen: { color: '#047857' },
  textClosed: { color: '#b91c1c' },
  logoutBtn: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  logoutText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#64748b',
  },
  scrollTabs: {
    flexGrow: 0,
  },
  tabsContainer: {
    flexDirection: 'row',
    gap: 16,
    paddingRight: 20,
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
  },
  forceUpdateContainer: { flex: 1, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center', padding: 20 },
  forceUpdateCard: { backgroundColor: '#fff', borderRadius: 24, padding: 32, width: '100%', maxWidth: 400, alignItems: 'center' },
  forceUpdateTitle: { fontSize: 24, fontWeight: '900', color: '#0f172a', marginBottom: 12 },
  forceUpdateSubtitle: { fontSize: 16, color: '#64748b', textAlign: 'center', marginBottom: 32, fontWeight: 'bold' },
  updateBtn: { backgroundColor: '#10b981', paddingVertical: 16, paddingHorizontal: 32, borderRadius: 16, width: '100%', alignItems: 'center' },
  updateBtnText: { color: '#fff', fontSize: 18, fontWeight: '900' }
});
