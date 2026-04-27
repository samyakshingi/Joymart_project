import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { api } from '../api';
import { useStore } from '../store';

export default function Wallet() {
  const { user } = useStore();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rechargeAmount, setRechargeAmount] = useState('');
  const [isRecharging, setIsRecharging] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get(`/users/${user.phone}`);
        setProfile(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (user?.phone) fetchProfile();
  }, [user]);

  const requestRecharge = async (amount) => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return Alert.alert('Error', 'Enter a valid amount');
    
    setIsRecharging(true);
    try {
      await api.post('/wallet/recharge/request', {
        user_id: profile.id,
        amount: amt
      });
      Alert.alert('Success', 'Recharge request sent. Please pay the shopkeeper via UPI or Cash to reflect the balance.');
      setRechargeAmount('');
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to send recharge request.');
    } finally {
      setIsRecharging(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>My Wallet</Text>
      
      <View style={styles.balanceCard}>
        <View style={styles.cardGlow}></View>
        <Text style={styles.balanceLabel}>AVAILABLE BALANCE</Text>
        <Text style={styles.balanceAmount}>₹{parseFloat(profile?.wallet_balance || 0).toFixed(2)}</Text>
        <Text style={styles.balanceFooter}>JoyMart Prepaid Wallet</Text>
      </View>

      <View style={styles.addFundsSection}>
        <Text style={styles.addFundsTitle}>Add Funds</Text>
        
        <View style={styles.quickAmounts}>
          {[500, 1000, 2000].map(amt => (
            <TouchableOpacity 
              key={amt}
              style={[styles.quickAmountBtn, rechargeAmount === amt.toString() && styles.quickAmountBtnActive]}
              onPress={() => setRechargeAmount(amt.toString())}
            >
              <Text style={[styles.quickAmountText, rechargeAmount === amt.toString() && styles.quickAmountTextActive]}>
                ₹{amt}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.customInputRow}>
          <TextInput
            style={styles.input}
            keyboardType="number-pad"
            placeholder="Custom Amount"
            value={rechargeAmount}
            onChangeText={setRechargeAmount}
          />
          <TouchableOpacity 
            style={[styles.requestBtn, (isRecharging || !rechargeAmount) && styles.requestBtnDisabled]}
            onPress={() => requestRecharge(rechargeAmount)}
            disabled={isRecharging || !rechargeAmount}
          >
            {isRecharging ? <ActivityIndicator color="#fff" /> : <Text style={styles.requestBtnText}>Request</Text>}
          </TouchableOpacity>
        </View>

        <Text style={styles.helperText}>Amount will be credited after shopkeeper approves payment.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', padding: 16 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 28, fontWeight: '900', color: '#0f172a', marginBottom: 20 },
  balanceCard: {
    backgroundColor: '#0f172a',
    borderRadius: 24,
    padding: 30,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 24,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  cardGlow: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 120,
    height: 120,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 60,
  },
  balanceLabel: { color: '#94a3b8', fontSize: 12, fontWeight: '900', letterSpacing: 2, marginBottom: 8 },
  balanceAmount: { color: '#fff', fontSize: 48, fontWeight: '900' },
  balanceFooter: { color: '#34d399', fontSize: 14, fontWeight: 'bold', marginTop: 24 },
  addFundsSection: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  addFundsTitle: { fontSize: 20, fontWeight: '900', color: '#0f172a', marginBottom: 16 },
  quickAmounts: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  quickAmountBtn: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#f1f5f9',
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  quickAmountBtnActive: { borderColor: '#10b981', backgroundColor: '#ecfdf5' },
  quickAmountText: { color: '#64748b', fontSize: 16, fontWeight: '900' },
  quickAmountTextActive: { color: '#059669' },
  customInputRow: { flexDirection: 'row', gap: 12 },
  input: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderWidth: 2,
    borderColor: '#f1f5f9',
    borderRadius: 16,
    paddingHorizontal: 16,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  requestBtn: {
    backgroundColor: '#10b981',
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
  requestBtnDisabled: { opacity: 0.5 },
  requestBtnText: { color: '#fff', fontWeight: '900', fontSize: 16 },
  helperText: { textAlign: 'center', color: '#94a3b8', fontSize: 12, fontWeight: 'bold', marginTop: 16 }
});
