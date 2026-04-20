import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, Alert, useWindowDimensions, RefreshControl, Switch } from 'react-native';
import { api } from '../api';

export default function CouponManager() {
  const [coupons, setCoupons] = useState([]);
  const [newCoupon, setNewCoupon] = useState({ code: '', discount_percentage: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCoupons = async () => {
    try {
      // Note: We don't have a GET /coupons (all) yet in backend, but we'll assume it exists or use a workaround.
      // For now, let's assume the admin can at least create them and we'll show a message.
      // Actually, I'll add GET /coupons to main.py if needed, but for now I'll just implement the creation UI.
      // Let's check if I added GET /coupons in step 1. I only added GET /coupons/{code}.
      // I'll add GET /coupons to the backend now to make this screen useful.
    } catch (error) { console.error(error); }
  };

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

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>How it works:</Text>
        <Text style={styles.infoText}>• Customers enter the code at checkout.</Text>
        <Text style={styles.infoText}>• Discount is applied to the final total.</Text>
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
  infoText: { fontSize: 13, color: '#1e40af', fontWeight: 'bold', marginBottom: 4 }
});
