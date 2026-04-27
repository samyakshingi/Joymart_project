import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator, Image } from 'react-native';
import { api } from '../api';
import { useStore } from '../store';

export default function Subscriptions() {
  const { user } = useStore();
  const [profile, setProfile] = useState(null);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userRes = await api.get(`/users/${user.phone}`);
        setProfile(userRes.data);
        
        const subsRes = await api.get(`/users/${userRes.data.id}/subscriptions`);
        setSubscriptions(subsRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (user?.phone) fetchData();
  }, [user]);

  const toggleStatus = async (subId, currentStatus) => {
    try {
      await api.put(`/subscriptions/${subId}/status?is_active=${!currentStatus}`);
      setSubscriptions(prev => prev.map(s => s.id === subId ? { ...s, status: !currentStatus } : s));
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to update subscription status');
    }
  };

  const deleteSub = (subId) => {
    Alert.alert(
      "Delete Subscription",
      "Are you sure you want to delete this subscription?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              await api.delete(`/subscriptions/${subId}`);
              setSubscriptions(prev => prev.filter(s => s.id !== subId));
            } catch (err) {
              console.error(err);
              Alert.alert('Error', 'Failed to delete subscription');
            }
          }
        }
      ]
    );
  };

  const renderItem = ({ item }) => (
    <View style={[styles.card, !item.status && styles.cardInactive]}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <View style={styles.productImageWrapper}>
            {item.product?.image_url ? (
              <Image source={{ uri: item.product.image_url }} style={styles.productImage} resizeMode="contain" />
            ) : (
              <Text style={styles.productImageFallback}>?</Text>
            )}
          </View>
          <View style={styles.productInfo}>
            <Text style={styles.productName} numberOfLines={1}>{item.product?.name || 'Unknown Product'}</Text>
            <View style={styles.badges}>
              <View style={styles.badgeBlue}>
                <Text style={styles.badgeBlueText}>{item.frequency}</Text>
              </View>
              <View style={styles.badgeGray}>
                <Text style={styles.badgeGrayText}>Qty: {item.quantity}</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
      
      <View style={styles.cardBottom}>
        <View>
          <Text style={styles.costLabel}>Cost per delivery</Text>
          <Text style={styles.costAmount}>₹{((item.product?.discounted_price || item.product?.price) * item.quantity).toFixed(2)}</Text>
        </View>
        
        <View style={styles.actions}>
          <TouchableOpacity 
            style={[styles.toggleBtn, item.status ? styles.toggleBtnPause : styles.toggleBtnResume]} 
            onPress={() => toggleStatus(item.id, item.status)}
          >
            <Text style={[styles.toggleBtnText, item.status ? styles.toggleBtnTextPause : styles.toggleBtnTextResume]}>
              {item.status ? 'Pause' : 'Resume'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteBtn} onPress={() => deleteSub(item.id)}>
            <Text style={styles.deleteBtnText}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Subscriptions</Text>
        <View style={styles.activeBadge}>
          <Text style={styles.activeBadgeText}>{subscriptions.filter(s => s.status).length} Active</Text>
        </View>
      </View>

      <View style={styles.infoBanner}>
        <Text style={styles.infoBannerIcon}>💡</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.infoBannerTitle}>Automated Deliveries</Text>
          <Text style={styles.infoBannerText}>Active subscriptions are deducted from your JoyMart Wallet automatically.</Text>
        </View>
      </View>

      {subscriptions.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyIcon}>🔄</Text>
          <Text style={styles.emptyTitle}>No Subscriptions Yet</Text>
          <Text style={styles.emptySubtitle}>Subscribe to daily essentials directly from the catalog!</Text>
        </View>
      ) : (
        <FlatList
          data={subscriptions}
          keyExtractor={item => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 40 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', padding: 16 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  headerTitle: { fontSize: 28, fontWeight: '900', color: '#0f172a' },
  activeBadge: { backgroundColor: '#dbeafe', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  activeBadgeText: { color: '#1d4ed8', fontWeight: 'bold', fontSize: 12 },
  infoBanner: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  infoBannerIcon: { fontSize: 24 },
  infoBannerTitle: { fontSize: 14, fontWeight: '900', color: '#1e3a8a', marginBottom: 4 },
  infoBannerText: { fontSize: 12, fontWeight: 'bold', color: '#1e40af', lineHeight: 18 },
  emptyBox: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    marginTop: 20,
  },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '900', color: '#0f172a', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: '#64748b', textAlign: 'center', fontWeight: 'bold' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  cardInactive: { opacity: 0.7, borderColor: '#e2e8f0' },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
    paddingBottom: 16,
  },
  cardHeaderLeft: { flexDirection: 'row', gap: 12, flex: 1 },
  productImageWrapper: {
    width: 48,
    height: 48,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  productImage: { width: 36, height: 36 },
  productImageFallback: { fontSize: 20, fontWeight: '900', color: '#cbd5e1' },
  productInfo: { flex: 1, justifyContent: 'center' },
  productName: { fontSize: 16, fontWeight: '900', color: '#0f172a', marginBottom: 6 },
  badges: { flexDirection: 'row', gap: 8 },
  badgeBlue: { backgroundColor: '#eff6ff', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeBlueText: { color: '#2563eb', fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  badgeGray: { backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeGrayText: { color: '#475569', fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  costLabel: { fontSize: 10, fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 2 },
  costAmount: { fontSize: 20, fontWeight: '900', color: '#0f172a' },
  actions: { flexDirection: 'row', gap: 8 },
  toggleBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  toggleBtnPause: { backgroundColor: '#fffbeb' },
  toggleBtnResume: { backgroundColor: '#ecfdf5' },
  toggleBtnText: { fontWeight: '900', fontSize: 12 },
  toggleBtnTextPause: { color: '#d97706' },
  toggleBtnTextResume: { color: '#059669' },
  deleteBtn: {
    backgroundColor: '#fef2f2',
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnText: { color: '#ef4444', fontWeight: '900', fontSize: 14 }
});
