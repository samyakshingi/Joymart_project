import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Modal, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useStore } from '../store';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Profile() {
  const router = useRouter();
  const { user, setUser } = useStore();
  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  
  const { t, i18n } = useTranslation();

  const changeLanguage = async (lng) => {
    i18n.changeLanguage(lng);
    await AsyncStorage.setItem('joymart_language', lng);
  };

  const fetchProfile = async () => {
    if (!user.phone) {
      setIsLoading(false);
      return;
    }
    try {
      const userRes = await api.get(`/users/${user.phone}`);
      setProfile(userRes.data);
      
      const ordersRes = await api.get(`/users/${user.phone}/orders`);
      setOrders(ordersRes.data);
    } catch (err) {
      console.error("Failed to fetch profile:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [user.phone]);

  const handleLogout = () => {
    setUser({ phone: '', name: '', society_id: '', flat_number: '' });
    router.push('/login');
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10b981" />
        <Text style={styles.loadingText}>Loading your profile...</Text>
      </View>
    );
  }

  if (!user.phone || !profile) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>No Profile Found</Text>
        <Text style={styles.emptySubtitle}>Login to see your orders and details.</Text>
        <TouchableOpacity style={styles.loginBtn} onPress={() => router.push('/login')}>
          <Text style={styles.loginBtnText}>Login Now</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Profile Header */}
      <View style={styles.headerCard}>
        <View style={styles.headerTop}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{profile.name.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{profile.name}</Text>
            <Text style={styles.userPhone}>+91 {profile.phone}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutBtnText}>{t('Logout') || 'Logout'}</Text>
        </TouchableOpacity>
      </View>

      {/* Account Hub Navigation */}
      <View style={styles.hubContainer}>
        <TouchableOpacity style={styles.hubBtn} onPress={() => router.push('/wallet')}>
          <View style={[styles.hubIconBg, { backgroundColor: '#ecfdf5' }]}>
            <Text style={{fontSize: 24}}>💳</Text>
          </View>
          <Text style={styles.hubTitle}>{t('My Wallet') || 'My Wallet'}</Text>
          <Text style={styles.hubSubtitle}>Balance & Recharge</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.hubBtn} onPress={() => router.push('/lists')}>
          <View style={[styles.hubIconBg, { backgroundColor: '#fffbeb' }]}>
            <Text style={{fontSize: 24}}>📝</Text>
          </View>
          <Text style={styles.hubTitle}>{t('Smart Lists') || 'Smart Lists'}</Text>
          <Text style={styles.hubSubtitle}>Monthly Ration</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.hubBtn} onPress={() => router.push('/subscriptions')}>
          <View style={[styles.hubIconBg, { backgroundColor: '#eff6ff' }]}>
            <Text style={{fontSize: 24}}>🔄</Text>
          </View>
          <Text style={styles.hubTitle}>{t('Subscriptions') || 'Subscriptions'}</Text>
          <Text style={styles.hubSubtitle}>Automated Delivery</Text>
        </TouchableOpacity>
      </View>

      {/* Language Toggle */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('Change Language') || 'Change Language'}</Text>
        </View>
        <View style={styles.langContainer}>
          <TouchableOpacity 
            style={[styles.langBtn, i18n.language === 'en' && styles.langBtnActive]}
            onPress={() => changeLanguage('en')}
          >
            <Text style={[styles.langBtnText, i18n.language === 'en' && styles.langBtnTextActive]}>English</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.langBtn, i18n.language === 'hi' && styles.langBtnActive]}
            onPress={() => changeLanguage('hi')}
          >
            <Text style={[styles.langBtnText, i18n.language === 'hi' && styles.langBtnTextActive]}>हिन्दी</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Address Details */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('Saved Delivery Address') || 'Saved Delivery Address'}</Text>
        </View>
        <View style={styles.addressBox}>
          <Text style={styles.addressFlat}>{profile.flat_number}</Text>
          <Text style={styles.addressSociety}>{profile.society?.name}</Text>
        </View>
      </View>

      {/* Previous Orders */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('Previous Orders') || 'Previous Orders'}</Text>
        </View>
        
        {orders.length === 0 ? (
          <View style={styles.emptyOrders}>
            <Text style={styles.emptyOrdersText}>You haven't placed any orders yet.</Text>
            <TouchableOpacity onPress={() => router.push('/')}>
              <Text style={styles.browseText}>Start Shopping →</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.ordersList}>
            {orders.map(order => (
              <TouchableOpacity key={order.id} style={styles.orderCard} onPress={() => setSelectedOrder(order)}>
                <View style={styles.orderTop}>
                  <View>
                    <Text style={styles.orderId}>Order #{order.id}</Text>
                    <Text style={styles.orderDate}>
                      {new Date(order.order_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, order.status === 'Completed' ? styles.statusSuccess : order.status === 'Cancelled' ? styles.statusError : styles.statusPending]}>
                    <Text style={[styles.statusText, order.status === 'Completed' ? styles.statusTextSuccess : order.status === 'Cancelled' ? styles.statusTextError : styles.statusTextPending]}>
                      {order.status}
                    </Text>
                  </View>
                </View>
                <View style={styles.orderBottom}>
                  <Text style={styles.itemCount}>{order.items.reduce((sum, i) => sum + i.quantity, 0)} items</Text>
                  <Text style={styles.orderTotal}>₹{order.total_amount}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Order Details Modal */}
      <Modal visible={!!selectedOrder} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Order #{selectedOrder?.id}</Text>
                <Text style={styles.modalDate}>{selectedOrder && new Date(selectedOrder.order_date).toLocaleString('en-IN')}</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedOrder(null)}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.modalLabel}>ITEMS</Text>
              {selectedOrder?.items.map(item => (
                <View key={item.id} style={styles.itemRow}>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{item.product?.name}</Text>
                    <Text style={styles.itemQty}>{item.quantity} × ₹{item.price_at_purchase}</Text>
                  </View>
                  <Text style={styles.itemSubtotal}>₹{item.quantity * item.price_at_purchase}</Text>
                </View>
              ))}

              {selectedOrder?.delivery_instructions && (
                <View style={styles.instructionsBox}>
                  <Text style={styles.modalLabel}>INSTRUCTIONS</Text>
                  <Text style={styles.instructionsText}>{selectedOrder.delivery_instructions}</Text>
                </View>
              )}

              {selectedOrder?.status === 'Completed' && selectedOrder?.delivery_photo_url && (
                <View style={styles.podBox}>
                  <Text style={styles.modalLabel}>DELIVERY PROOF - LEFT AT DOOR</Text>
                  <Image source={{ uri: selectedOrder.delivery_photo_url }} style={styles.podImage} resizeMode="cover" />
                </View>
              )}

              <View style={styles.billBox}>
                <Text style={styles.modalLabel}>BILL SUMMARY</Text>
                {selectedOrder?.applied_coupon && (
                  <View style={styles.billRow}>
                    <Text style={styles.couponLabel}>Coupon Applied</Text>
                    <Text style={styles.couponValue}>{selectedOrder.applied_coupon}</Text>
                  </View>
                )}
                {selectedOrder?.tip_amount > 0 && (
                  <View style={styles.billRow}>
                    <Text style={styles.billText}>Rider Tip</Text>
                    <Text style={styles.billText}>₹{selectedOrder.tip_amount}</Text>
                  </View>
                )}
                <View style={[styles.billRow, styles.totalRow]}>
                  <Text style={styles.totalLabel}>Total Paid</Text>
                  <Text style={styles.totalValue}>₹{selectedOrder?.total_amount}</Text>
                </View>
                <Text style={styles.paymentMethod}>Paid via {selectedOrder?.payment_method}</Text>
              </View>
            </ScrollView>
            
            <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedOrder(null)}>
              <Text style={styles.closeBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  contentContainer: { padding: 16, paddingBottom: 40 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontWeight: 'bold', color: '#64748b' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyTitle: { fontSize: 24, fontWeight: '900', color: '#0f172a', marginBottom: 8 },
  emptySubtitle: { fontSize: 16, color: '#64748b', textAlign: 'center', marginBottom: 24 },
  loginBtn: { backgroundColor: '#10b981', paddingHorizontal: 32, paddingVertical: 16, borderRadius: 16 },
  loginBtnText: { color: '#fff', fontWeight: '900', fontSize: 16 },
  headerCard: { backgroundColor: '#fff', borderRadius: 24, padding: 20, marginBottom: 20, borderTopWidth: 4, borderTopColor: '#10b981', elevation: 2 },
  headerTop: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20 },
  avatar: { width: 64, height: 64, backgroundColor: '#ecfdf5', borderRadius: 32, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 24, fontWeight: '900', color: '#059669' },
  userInfo: { flex: 1 },
  userName: { fontSize: 20, fontWeight: '900', color: '#0f172a' },
  userPhone: { fontSize: 14, fontWeight: 'bold', color: '#64748b', marginTop: 2 },
  logoutBtn: { backgroundColor: '#fef2f2', paddingVertical: 12, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#fee2e2' },
  logoutBtnText: { color: '#ef4444', fontWeight: 'bold' },
  hubContainer: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginBottom: 20 },
  hubBtn: { flex: 1, backgroundColor: '#fff', padding: 12, borderRadius: 20, alignItems: 'center', elevation: 1 },
  hubIconBg: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  hubTitle: { fontSize: 12, fontWeight: '900', color: '#0f172a', textAlign: 'center' },
  hubSubtitle: { fontSize: 10, fontWeight: 'bold', color: '#64748b', textAlign: 'center', marginTop: 2 },
  sectionCard: { backgroundColor: '#fff', borderRadius: 24, padding: 20, marginBottom: 20, elevation: 1 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '900', color: '#0f172a' },
  addressBox: { backgroundColor: '#f8fafc', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#f1f5f9' },
  addressFlat: { fontSize: 18, fontWeight: '900', color: '#0f172a' },
  addressSociety: { fontSize: 14, fontWeight: 'bold', color: '#64748b', marginTop: 4 },
  emptyOrders: { alignItems: 'center', paddingVertical: 20 },
  emptyOrdersText: { color: '#94a3b8', fontWeight: 'bold', marginBottom: 12 },
  browseText: { color: '#10b981', fontWeight: '900' },
  ordersList: { gap: 12 },
  orderCard: { backgroundColor: '#fff', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#f1f5f9' },
  orderTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  orderId: { fontSize: 16, fontWeight: '900', color: '#0f172a' },
  orderDate: { fontSize: 12, fontWeight: 'bold', color: '#94a3b8', marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusPending: { backgroundColor: '#fffbeb' },
  statusSuccess: { backgroundColor: '#ecfdf5' },
  statusError: { backgroundColor: '#fef2f2' },
  statusText: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  statusTextPending: { color: '#b45309' },
  statusTextSuccess: { color: '#059669' },
  statusTextError: { color: '#ef4444' },
  orderBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemCount: { fontSize: 14, fontWeight: 'bold', color: '#64748b' },
  orderTotal: { fontSize: 18, fontWeight: '900', color: '#0f172a' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  modalTitle: { fontSize: 24, fontWeight: '900', color: '#0f172a' },
  modalDate: { fontSize: 12, fontWeight: 'bold', color: '#94a3b8', marginTop: 4 },
  modalCloseText: { fontSize: 24, color: '#94a3b8', fontWeight: 'bold' },
  modalBody: { marginBottom: 24 },
  modalLabel: { fontSize: 10, fontWeight: '900', color: '#94a3b8', letterSpacing: 1, marginBottom: 12 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', padding: 12, borderRadius: 16, marginBottom: 8 },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: 'bold', color: '#0f172a' },
  itemQty: { fontSize: 12, color: '#64748b', marginTop: 2 },
  itemSubtotal: { fontSize: 14, fontWeight: '900', color: '#0f172a' },
  instructionsBox: { marginTop: 16, marginBottom: 16 },
  instructionsText: { backgroundColor: '#fffbeb', padding: 16, borderRadius: 16, color: '#92400e', fontWeight: 'bold', fontSize: 14, borderWidth: 1, borderColor: '#fef3c7' },
  podBox: { marginTop: 16, marginBottom: 8 },
  podImage: { width: '100%', height: 200, borderRadius: 16, marginTop: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  billBox: { marginTop: 8, backgroundColor: '#f8fafc', padding: 16, borderRadius: 20 },
  billRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  billText: { fontSize: 14, fontWeight: 'bold', color: '#64748b' },
  couponLabel: { color: '#059669', fontWeight: 'bold' },
  couponValue: { backgroundColor: '#d1fae5', color: '#065f46', fontSize: 10, fontWeight: '900', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  totalRow: { borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 12, marginTop: 4 },
  totalLabel: { fontSize: 18, fontWeight: '900', color: '#0f172a' },
  totalValue: { fontSize: 24, fontWeight: '900', color: '#059669' },
  paymentMethod: { textAlign: 'center', fontSize: 10, fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', marginTop: 12 },
  closeBtn: { backgroundColor: '#0f172a', padding: 16, borderRadius: 16, alignItems: 'center' },
  closeBtnText: { color: '#fff', fontWeight: '900', fontSize: 16 },
  langContainer: { flexDirection: 'row', gap: 12, marginTop: 8 },
  langBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center' },
  langBtnActive: { backgroundColor: '#10b981', borderColor: '#10b981' },
  langBtnText: { fontWeight: 'bold', color: '#64748b' },
  langBtnTextActive: { color: '#fff' }
});
