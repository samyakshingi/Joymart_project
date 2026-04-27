import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, Alert, useWindowDimensions, RefreshControl, Switch } from 'react-native';
import { api } from '../api';

export default function CouponManager() {
  const [coupons, setCoupons] = useState([]);
  const [newCoupon, setNewCoupon] = useState({ code: '', discount_percentage: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedCoupon, setExpandedCoupon] = useState(null);
  const [usageData, setUsageData] = useState({});
  const [isLoadingUsage, setIsLoadingUsage] = useState(false);

  const fetchCoupons = async () => {
    try {
      const res = await api.get('/coupons');
      setCoupons(res.data);
    } catch (error) { console.error(error); }
  };

  const fetchUsage = async (code) => {
    if (expandedCoupon === code) {
      setExpandedCoupon(null);
      return;
    }
    setExpandedCoupon(code);
    setIsLoadingUsage(true);
    try {
      const res = await api.get(`/coupons/${code}/usage`);
      setUsageData(prev => ({ ...prev, [code]: res.data }));
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingUsage(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleCreateCoupon = async () => {
    if (!newCoupon.code || !newCoupon.discount_percentage) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }
    setIsSubmitting(true);
    try {
      await api.post('/coupons', {
        code: newCoupon.code.toUpperCase(),
        discount_percentage: parseInt(newCoupon.discount_percentage),
        is_active: true
      });
      setNewCoupon({ code: '', discount_percentage: '' });
      Alert.alert("Success", "Coupon created successfully!");
    } catch (error) {
      Alert.alert("Error", "Failed to create coupon. Code might already exist.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>Coupon Manager</Text>
        <Text style={styles.subtitle}>Create discount codes for your customers.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Create New Coupon</Text>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Coupon Code</Text>
          <TextInput 
            style={styles.input} 
            value={newCoupon.code} 
            onChangeText={(v) => setNewCoupon({...newCoupon, code: v})} 
            placeholder="e.g. WELCOME10"
            autoCapitalize="characters"
          />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Discount Percentage (%)</Text>
          <TextInput 
            style={styles.input} 
            keyboardType="numeric" 
            value={newCoupon.discount_percentage} 
            onChangeText={(v) => setNewCoupon({...newCoupon, discount_percentage: v})} 
            placeholder="10"
          />
        </View>
        <TouchableOpacity 
          style={[styles.btn, isSubmitting && styles.btnDisabled]} 
          onPress={handleCreateCoupon}
          disabled={isSubmitting}
        >
          <Text style={styles.btnText}>{isSubmitting ? 'Creating...' : 'Create Coupon'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Active Coupons</Text>
        {coupons.length === 0 ? (
          <Text style={styles.emptyText}>No coupons created yet.</Text>
        ) : (
          coupons.map(c => (
            <View key={c.id} style={styles.couponItem}>
              <TouchableOpacity style={styles.couponHeader} onPress={() => fetchUsage(c.code)}>
                <View>
                  <Text style={styles.couponCode}>{c.code}</Text>
                  <Text style={styles.couponDiscount}>{c.discount_percentage}% OFF</Text>
                </View>
                <Text style={styles.expandIcon}>{expandedCoupon === c.code ? '▲' : '▼'}</Text>
              </TouchableOpacity>
              
              {expandedCoupon === c.code && (
                <View style={styles.usageContainer}>
                  <Text style={styles.usageTitle}>USAGE LOG</Text>
                  {isLoadingUsage && !usageData[c.code] ? (
                    <ActivityIndicator size="small" color="#10b981" />
                  ) : (usageData[c.code]?.length === 0 ? (
                    <Text style={styles.noUsageText}>No usage recorded yet.</Text>
                  ) : (
                    usageData[c.code].map((use, idx) => (
                      <View key={idx} style={styles.usageRow}>
                        <View>
                          <Text style={styles.usageName}>{use.user_name}</Text>
                          <Text style={styles.usagePhone}>{use.user_phone}</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={styles.usageAmount}>₹{use.total_amount}</Text>
                          <Text style={styles.usageDate}>{new Date(use.order_date).toLocaleDateString()}</Text>
                        </View>
                      </View>
                    ))
                  ))}
                </View>
              )}
            </View>
          ))
        )}
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>How it works:</Text>
        <Text style={styles.infoText}>• Click a coupon to see who used it.</Text>
        <Text style={styles.infoText}>• Total order value includes taxes and delivery.</Text>
        <Text style={styles.infoText}>• Coupons are active immediately after creation.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  contentContainer: { padding: 20 },
  header: { marginBottom: 24 },
  title: { fontSize: 28, fontWeight: '900', color: '#0f172a' },
  subtitle: { fontSize: 14, color: '#64748b', fontWeight: 'bold', marginTop: 4 },
  card: { backgroundColor: '#fff', borderRadius: 24, padding: 24, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 15 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#0f172a', marginBottom: 20 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 12, fontWeight: 'bold', color: '#475569', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 12, padding: 14, fontSize: 16, backgroundColor: '#f8fafc', fontWeight: 'bold' },
  btn: { backgroundColor: '#0f172a', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  btnDisabled: { opacity: 0.7 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  infoBox: { marginTop: 32, backgroundColor: '#eff6ff', padding: 20, borderRadius: 20, borderWidth: 1, borderColor: '#bfdbfe' },
  infoTitle: { fontSize: 14, fontWeight: '900', color: '#1e40af', marginBottom: 8 },
  infoText: { fontSize: 13, color: '#1e40af', fontWeight: 'bold', marginBottom: 4 },
  couponItem: { borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingVertical: 12 },
  couponHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  couponCode: { fontSize: 16, fontWeight: '900', color: '#0f172a' },
  couponDiscount: { fontSize: 12, fontWeight: 'bold', color: '#10b981', marginTop: 2 },
  expandIcon: { fontSize: 10, color: '#94a3b8' },
  usageContainer: { backgroundColor: '#f8fafc', padding: 12, borderRadius: 12, marginTop: 12 },
  usageTitle: { fontSize: 10, fontWeight: '900', color: '#94a3b8', letterSpacing: 1, marginBottom: 8 },
  noUsageText: { fontSize: 12, color: '#94a3b8', fontStyle: 'italic', textAlign: 'center', paddingVertical: 8 },
  usageRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  usageName: { fontSize: 12, fontWeight: 'bold', color: '#1e293b' },
  usagePhone: { fontSize: 10, color: '#64748b' },
  usageAmount: { fontSize: 12, fontWeight: '900', color: '#059669' },
  usageDate: { fontSize: 10, color: '#94a3b8' },
  emptyText: { textAlign: 'center', color: '#94a3b8', fontWeight: 'bold', paddingVertical: 20 }
});
