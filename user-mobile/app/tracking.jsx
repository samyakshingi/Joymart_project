import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { api } from '../api';
import { useStore } from '../store';

export default function Tracking() {
  const { user } = useStore();
  const [phone, setPhone] = useState(user.phone || '');
  const [orders, setOrders] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showOlderOrders, setShowOlderOrders] = useState(false);

  useEffect(() => {
    if (user.phone) {
      setPhone(user.phone);
      setIsLoading(true);
      api.get(`/orders/tracking/${user.phone}`)
        .then(res => {
          setOrders(res.data);
          setHasSearched(true);
        })
        .catch(err => {
          if (err.response && err.response.status === 404) {
            setError("No orders found for this mobile number.");
          }
          setHasSearched(true);
        })
        .finally(() => setIsLoading(false));
    }
  }, [user.phone]);

  useEffect(() => {
    let intervalId;
    if (hasSearched && phone) {
      intervalId = setInterval(() => {
        api.get(`/orders/tracking/${phone}`)
          .then(res => {
             setOrders(prevOrders => {
               const newOrders = res.data;
               newOrders.forEach(newO => {
                 const prevO = prevOrders.find(o => o.id === newO.id);
                 if (prevO && prevO.status !== 'OutForDelivery' && newO.status === 'OutForDelivery') {
                    // Trigger a local push notification (using Alert for simplicity in bare Expo)
                    Alert.alert("JoyMart: Your rider is arriving soon!", `Order #${newO.id} is out for delivery!`);
                 }
               });
               return newOrders;
             });
          })
          .catch(err => console.error(err));
      }, 5000);
    }
    return () => clearInterval(intervalId);
  }, [hasSearched, phone]);

  const handleTrack = async () => {
    if (!phone) return;
    setIsLoading(true);
    setError('');
    try {
      const res = await api.get(`/orders/tracking/${phone}`);
      setOrders(res.data);
      setHasSearched(true);
    } catch (err) {
      if (err.response && err.response.status === 404) {
        setOrders([]);
        setError("No orders found for this mobile number. Make sure you typed it correctly!");
      } else {
        setError("An error occurred while tracking. Our servers might be busy.");
      }
      setHasSearched(true);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusDisplay = (status) => {
    switch (status) {
      case 'Pending': 
        return { text: 'Waiting for Confirmation' };
      case 'Accepted': 
        return { text: 'Order Accepted & Packing' };
      case 'OutForDelivery': 
        return { text: 'Out for Delivery!' };
      case 'Completed': 
        return { text: 'Delivered' };
      case 'Cancelled': 
        return { text: 'Cancelled' };
      default: 
        return { text: status };
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.searchCard}>
        <View style={styles.iconCircle}>
          <Text style={styles.iconText}>📦</Text>
        </View>
        <Text style={styles.title}>Where's my order?</Text>
        <Text style={styles.subtitle}>Enter your 10-digit mobile number for real-time updates.</Text>
        
        <View style={styles.formRow}>
          <TextInput 
            style={styles.input}
            keyboardType="numeric"
            maxLength={10}
            placeholder="Mobile Number"
            value={phone}
            onChangeText={setPhone}
          />
          <TouchableOpacity style={[styles.trackButton, isLoading && styles.disabledTrack]} onPress={handleTrack} disabled={isLoading}>
            {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.trackButtonText}>Track</Text>}
          </TouchableOpacity>
        </View>
      </View>

      {hasSearched && (
        <View style={styles.resultsContainer}>
          {error !== '' && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
          
          {orders.map((order, index) => {
            if (index > 0 && !showOlderOrders) return null;
            
            const steps = ['Pending', 'Accepted', 'OutForDelivery', 'Completed'];
            const currentStepIndex = steps.indexOf(order.status);
            
            return (
              <View key={order.id} style={styles.orderCard}>
                {index === 1 && showOlderOrders && (
                  <View style={styles.olderHeader}>
                    <Text style={styles.olderHeaderText}>Older Orders</Text>
                  </View>
                )}
                
                <View style={styles.orderHeader}>
                  <View>
                    <View style={styles.idRow}>
                      <Text style={styles.orderIdLabel}>ORDER ID</Text>
                      {index === 0 && (
                        <View style={styles.latestBadge}>
                          <Text style={styles.latestBadgeText}>LATEST</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.orderIdValue}>#{order.id}</Text>
                    <Text style={styles.orderDate}>{new Date(order.order_date).toLocaleString()}</Text>
                  </View>
                  {order.status === 'Pending' && (
                    <TouchableOpacity 
                      style={styles.cancelBtn}
                      onPress={() => {
                        Alert.alert("Cancel Order", "Are you sure you want to cancel this order?", [
                          { text: "No", style: "cancel" },
                          { text: "Yes", onPress: async () => {
                              try {
                                await api.put(`/orders/${order.id}/cancel`);
                                const res = await api.get(`/orders/tracking/${phone}`);
                                setOrders(res.data);
                              } catch (err) {
                                Alert.alert("Error", "Failed to cancel order.");
                              }
                            } 
                          }
                        ]);
                      }}
                    >
                      <Text style={styles.cancelBtnText}>Cancel</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {order.status !== 'Cancelled' ? (
                  <View style={styles.trackerContainer}>
                    <View style={styles.trackerLineBg} />
                    <View style={[styles.trackerLineFill, { width: `${(Math.max(0, currentStepIndex) / 3) * 100}%` }]} />
                    
                    {steps.map((step, i) => {
                      const isCompleted = i <= currentStepIndex;
                      const isCurrent = i === currentStepIndex;
                      return (
                        <View key={step} style={styles.trackerStep}>
                          <View style={[styles.trackerDot, isCompleted ? styles.trackerDotCompleted : styles.trackerDotPending]}>
                            <Text style={isCompleted ? styles.dotTextCompleted : styles.dotTextPending}>
                              {isCompleted ? '✓' : i + 1}
                            </Text>
                          </View>
                          <Text style={[styles.trackerStepText, isCurrent ? styles.textCurrent : (isCompleted ? styles.textCompleted : styles.textPending)]}>
                            {step === 'OutForDelivery' ? 'Out for Delivery' : step}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                ) : (
                  <View style={styles.cancelledBox}>
                    <Text style={styles.cancelledText}>This order was cancelled.</Text>
                  </View>
                )}

                <View style={styles.itemsBox}>
                  <Text style={styles.itemsLabel}>ITEMS</Text>
                  {order.items.map(item => (
                    <View key={item.id} style={styles.itemRow}>
                      <Text style={styles.itemName}>{item.product?.name || `Product #${item.product_id}`} x {item.quantity}</Text>
                      <Text style={styles.itemPrice}>₹{item.price_at_purchase * item.quantity}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.totalRow}>
                  <View>
                    <Text style={styles.totalLabel}>Total Amount Paid</Text>
                    <Text style={styles.totalSub}>(Cash/UPI on Delivery)</Text>
                  </View>
                  <Text style={styles.totalValue}>₹{order.total_amount}</Text>
                </View>
              </View>
            );
          })}
          
          {orders.length > 1 && (
            <TouchableOpacity 
              style={styles.toggleOlderBtn}
              onPress={() => setShowOlderOrders(!showOlderOrders)}
            >
              <Text style={styles.toggleOlderBtnText}>
                {showOlderOrders ? 'Hide Older Orders' : `View ${orders.length - 1} Older Orders`}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  contentContainer: { padding: 16, paddingBottom: 40 },
  searchCard: { backgroundColor: '#fff', padding: 32, borderRadius: 32, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 4, alignItems: 'center', marginBottom: 32 },
  iconCircle: { width: 80, height: 80, backgroundColor: '#f8fafc', borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  iconText: { fontSize: 32 },
  title: { fontSize: 28, fontWeight: '900', color: '#0f172a', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 16, fontWeight: 'bold', color: '#64748b', textAlign: 'center', marginBottom: 24 },
  formRow: { flexDirection: 'row', width: '100%', gap: 12 },
  input: { flex: 1, backgroundColor: '#f8fafc', borderWidth: 2, borderColor: '#f1f5f9', borderRadius: 16, paddingHorizontal: 20, fontSize: 18, fontWeight: '900', color: '#0f172a', textAlign: 'center' },
  trackButton: { backgroundColor: '#0f172a', paddingHorizontal: 24, paddingVertical: 16, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  disabledTrack: { opacity: 0.7 },
  trackButtonText: { color: '#fff', fontSize: 16, fontWeight: '900' },
  resultsContainer: { gap: 24 },
  errorBox: { backgroundColor: '#fef2f2', borderWidth: 2, borderColor: '#fecaca', borderStyle: 'dashed', padding: 16, borderRadius: 24, alignItems: 'center' },
  errorText: { color: '#ef4444', fontWeight: 'bold', fontSize: 16, textAlign: 'center' },
  orderCard: { backgroundColor: '#fff', borderRadius: 24, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  olderHeader: { borderTopWidth: 2, borderTopColor: '#f1f5f9', borderStyle: 'dashed', paddingTop: 24, marginTop: 12, marginBottom: 16, alignItems: 'center' },
  olderHeaderText: { fontSize: 14, fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 2 },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  idRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  orderIdLabel: { fontSize: 10, fontWeight: '900', color: '#94a3b8', letterSpacing: 1 },
  latestBadge: { backgroundColor: '#ecfdf5', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, borderWidth: 1, borderColor: '#d1fae5' },
  latestBadgeText: { fontSize: 8, fontWeight: '900', color: '#047857', letterSpacing: 1 },
  orderIdValue: { fontSize: 24, fontWeight: '900', color: '#0f172a' },
  orderDate: { fontSize: 14, fontWeight: 'bold', color: '#64748b', marginTop: 4 },
  cancelBtn: { paddingHorizontal: 12, paddingVertical: 6, borderWidth: 2, borderColor: '#fecaca', borderRadius: 8 },
  cancelBtnText: { color: '#ef4444', fontWeight: 'bold', fontSize: 12 },
  trackerContainer: { position: 'relative', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 32, paddingHorizontal: 16 },
  trackerLineBg: { position: 'absolute', left: 32, right: 32, top: 18, height: 4, backgroundColor: '#f1f5f9', borderRadius: 2 },
  trackerLineFill: { position: 'absolute', left: 32, top: 18, height: 4, backgroundColor: '#10b981', borderRadius: 2, zIndex: 1 },
  trackerStep: { alignItems: 'center', zIndex: 2 },
  trackerDot: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 4 },
  trackerDotCompleted: { backgroundColor: '#10b981', borderColor: '#d1fae5' },
  trackerDotPending: { backgroundColor: '#fff', borderColor: '#f1f5f9' },
  dotTextCompleted: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  dotTextPending: { color: '#cbd5e1', fontWeight: 'bold', fontSize: 16 },
  trackerStepText: { position: 'absolute', top: 48, fontSize: 10, fontWeight: '900', textTransform: 'uppercase', width: 80, textAlign: 'center' },
  textCurrent: { color: '#059669' },
  textCompleted: { color: '#334155' },
  textPending: { color: '#94a3b8' },
  cancelledBox: { backgroundColor: '#fef2f2', padding: 16, borderRadius: 16, alignItems: 'center', marginBottom: 24, borderWidth: 1, borderColor: '#fee2e2' },
  cancelledText: { color: '#ef4444', fontWeight: 'bold' },
  itemsBox: { backgroundColor: '#f8fafc', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#f1f5f9', marginBottom: 20 },
  itemsLabel: { fontSize: 10, fontWeight: '900', color: '#94a3b8', letterSpacing: 1, marginBottom: 12 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#fff', padding: 12, borderRadius: 12, marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  itemName: { fontSize: 14, fontWeight: 'bold', color: '#334155' },
  itemPrice: { fontSize: 14, fontWeight: '900', color: '#0f172a' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', borderTopWidth: 2, borderTopColor: '#f1f5f9', borderStyle: 'dashed', paddingTop: 20 },
  totalLabel: { fontSize: 14, fontWeight: 'bold', color: '#64748b' },
  totalSub: { fontSize: 12, fontWeight: 'bold', color: '#94a3b8' },
  totalValue: { fontSize: 32, fontWeight: '900', color: '#0f172a' },
  toggleOlderBtn: { backgroundColor: '#fff', paddingVertical: 16, borderRadius: 24, borderWidth: 2, borderColor: '#f1f5f9', alignItems: 'center' },
  toggleOlderBtnText: { color: '#475569', fontWeight: 'bold', fontSize: 16 }
});
