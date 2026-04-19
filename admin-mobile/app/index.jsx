import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, useWindowDimensions, RefreshControl } from 'react-native';
import { api } from '../api';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const { width } = useWindowDimensions();
  const isTablet = width > 768;

  const fetchOrders = async () => {
    try {
      const response = await api.get(`/orders`);
      setOrders(response.data);
      
      const statRes = await api.get(`/analytics/today`);
      setAnalytics(statRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  const updateStatus = async (orderId, newStatus) => {
    try {
      await api.put(`/orders/${orderId}/status`, { status: newStatus });
      fetchOrders();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const columns = ['Pending', 'Accepted', 'OutForDelivery', 'Completed'];

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.contentContainer}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.statsCard}>
        <View style={styles.statsHeader}>
          <Text style={styles.statsTitle}>Live Operations</Text>
          <Text style={styles.statsSubtitle}>Manage orders by moving them across stages.</Text>
        </View>
        {analytics && (
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>REV</Text>
              <Text style={[styles.statValue, { color: '#059669' }]}>₹{analytics.total_revenue.toFixed(0)}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>ORDERS</Text>
              <Text style={[styles.statValue, { color: '#2563eb' }]}>{analytics.total_orders}</Text>
            </View>
            <View style={[styles.statBox, { backgroundColor: '#fef3c7', borderColor: '#fde68a' }]}>
              <Text style={[styles.statLabel, { color: '#d97706' }]}>STOCK</Text>
              <Text style={[styles.statValue, { color: '#d97706' }]}>{analytics.out_of_stock_count}</Text>
            </View>
          </View>
        )}
      </View>

      <View style={[styles.kanbanContainer, isTablet ? styles.kanbanRow : styles.kanbanColumn]}>
        {columns.map(status => {
          const columnOrders = orders.filter(o => o.status === status).sort((a, b) => b.id - a.id);
          let headerColor = '#f8fafc';
          let textColor = '#0f172a';
          if (status === 'Pending') { headerColor = '#fef9c3'; textColor = '#854d0e'; }
          else if (status === 'Accepted') { headerColor = '#eff6ff'; textColor = '#1e40af'; }
          else if (status === 'OutForDelivery') { headerColor = '#f3e8ff'; textColor = '#6b21a8'; }
          else if (status === 'Completed') { headerColor = '#ecfdf5'; textColor = '#065f46'; }

          return (
            <View key={status} style={[styles.column, isTablet && styles.columnTablet]}>
              <View style={[styles.columnHeader, { backgroundColor: headerColor }]}>
                <Text style={[styles.columnTitle, { color: textColor }]}>{status}</Text>
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>{columnOrders.length}</Text>
                </View>
              </View>
              
              <View style={styles.columnBody}>
                {columnOrders.length === 0 ? (
                  <View style={styles.emptyBox}>
                    <Text style={styles.emptyText}>No orders here</Text>
                  </View>
                ) : (
                  columnOrders.map(order => (
                    <View key={order.id} style={styles.orderCard}>
                      <View style={styles.orderHeaderRow}>
                        <View>
                          <Text style={styles.orderIdLabel}>ORDER ID</Text>
                          <Text style={styles.orderIdValue}>#{order.id}</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={styles.orderIdLabel}>TOTAL</Text>
                          <Text style={styles.orderTotalValue}>₹{order.total_amount}</Text>
                        </View>
                      </View>
                      
                      <View style={styles.orderMetaRow}>
                        <Text style={styles.orderMetaText}>{order.items.reduce((sum, item) => sum + item.quantity, 0)} Items</Text>
                        <Text style={styles.orderMetaText}>•</Text>
                        <Text style={styles.orderMetaText}>User ID: {order.user_id}</Text>
                      </View>

                      {order.status === 'Pending' && (
                        <View style={styles.actionRow}>
                          <TouchableOpacity onPress={() => updateStatus(order.id, 'Accepted')} style={[styles.actionBtn, styles.btnAccept]}>
                            <Text style={styles.textAccept}>Accept</Text>
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => updateStatus(order.id, 'Cancelled')} style={[styles.actionBtn, styles.btnReject]}>
                            <Text style={styles.textReject}>Reject</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                      
                      {order.status === 'Accepted' && (
                        <View style={styles.actionRow}>
                          <TouchableOpacity onPress={() => updateStatus(order.id, 'OutForDelivery')} style={[styles.actionBtn, styles.btnDelivery]}>
                            <Text style={styles.textDelivery}>Send for Delivery</Text>
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => updateStatus(order.id, 'Cancelled')} style={[styles.actionBtn, styles.btnReject]}>
                            <Text style={styles.textReject}>Cancel</Text>
                          </TouchableOpacity>
                        </View>
                      )}

                      {order.status === 'OutForDelivery' && (
                        <View style={styles.actionRow}>
                          <TouchableOpacity onPress={() => updateStatus(order.id, 'Completed')} style={[styles.actionBtn, styles.btnComplete]}>
                            <Text style={styles.textComplete}>Mark Delivered</Text>
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => updateStatus(order.id, 'Cancelled')} style={[styles.actionBtn, styles.btnReject]}>
                            <Text style={styles.textReject}>Cancel</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                      
                      {order.status === 'Completed' && (
                        <View style={styles.completedBadge}>
                          <Text style={styles.completedBadgeText}>Order Completed</Text>
                        </View>
                      )}
                    </View>
                  ))
                )}
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  contentContainer: { padding: 16 },
  statsCard: { backgroundColor: '#fff', borderRadius: 24, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: '#e2e8f0' },
  statsHeader: { marginBottom: 16 },
  statsTitle: { fontSize: 20, fontWeight: '900', color: '#0f172a' },
  statsSubtitle: { fontSize: 14, color: '#64748b', fontWeight: 'bold' },
  statsRow: { flexDirection: 'row', gap: 12 },
  statBox: { flex: 1, backgroundColor: '#f8fafc', padding: 12, borderRadius: 16, borderWidth: 1, borderColor: '#f1f5f9', alignItems: 'center' },
  statLabel: { fontSize: 10, fontWeight: '900', color: '#94a3b8', letterSpacing: 1, marginBottom: 4 },
  statValue: { fontSize: 20, fontWeight: '900' },
  kanbanContainer: { gap: 16 },
  kanbanRow: { flexDirection: 'row', alignItems: 'flex-start' },
  kanbanColumn: { flexDirection: 'column' },
  column: { backgroundColor: '#f1f5f9', borderRadius: 24, borderWidth: 1, borderColor: '#e2e8f0', overflow: 'hidden', marginBottom: 16 },
  columnTablet: { flex: 1 },
  columnHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  columnTitle: { fontSize: 14, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
  countBadge: { backgroundColor: 'rgba(255,255,255,0.6)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  countBadgeText: { fontWeight: '900', fontSize: 12 },
  columnBody: { padding: 12, gap: 12 },
  emptyBox: { alignItems: 'center', paddingVertical: 32, borderWidth: 2, borderColor: '#e2e8f0', borderStyle: 'dashed', borderRadius: 16 },
  emptyText: { color: '#94a3b8', fontWeight: 'bold' },
  orderCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  orderHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingBottom: 12, marginBottom: 12 },
  orderIdLabel: { fontSize: 10, fontWeight: '900', color: '#94a3b8', letterSpacing: 1, marginBottom: 4 },
  orderIdValue: { fontSize: 20, fontWeight: '900', color: '#0f172a' },
  orderTotalValue: { fontSize: 20, fontWeight: '900', color: '#059669' },
  orderMetaRow: { flexDirection: 'row', backgroundColor: '#f8fafc', padding: 8, borderRadius: 8, justifyContent: 'space-between', marginBottom: 16 },
  orderMetaText: { fontSize: 12, fontWeight: 'bold', color: '#475569' },
  actionRow: { flexDirection: 'row', gap: 8 },
  actionBtn: { paddingVertical: 12, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  btnAccept: { flex: 2, backgroundColor: '#ecfdf5', borderWidth: 1, borderColor: '#a7f3d0' },
  textAccept: { color: '#047857', fontWeight: 'bold' },
  btnReject: { flex: 1, backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca' },
  textReject: { color: '#b91c1c', fontWeight: 'bold' },
  btnDelivery: { flex: 2, backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe' },
  textDelivery: { color: '#1d4ed8', fontWeight: 'bold' },
  btnComplete: { flex: 2, backgroundColor: '#f3e8ff', borderWidth: 1, borderColor: '#e9d5ff' },
  textComplete: { color: '#7e22ce', fontWeight: 'bold' },
  completedBadge: { backgroundColor: '#f8fafc', paddingVertical: 12, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#f1f5f9' },
  completedBadgeText: { color: '#64748b', fontWeight: 'bold' }
});
