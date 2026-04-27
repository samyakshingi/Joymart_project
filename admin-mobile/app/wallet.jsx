import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { api } from '../api';

export default function WalletRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRequests = async () => {
    try {
      const usersRes = await api.get('/users');
      const userMap = {};
      usersRes.data.forEach(u => userMap[u.id] = u);

      const reqRes = await api.get('/admin/wallet/requests');
      const enrichedRequests = reqRes.data.map(req => ({
        ...req,
        user: userMap[req.user_id]
      }));
      setRequests(enrichedRequests);
    } catch (err) {
      console.error(err);
      // Fail silently or show toast, handled broadly
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRequests();
  };

  const approveRequest = async (transactionId) => {
    try {
      await api.put(`/admin/wallet/approve/${transactionId}`);
      Alert.alert('Success', 'Funds approved successfully!');
      setRequests(prev => prev.filter(r => r.id !== transactionId));
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to approve request.');
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.userName}>{item.user?.name || `User #${item.user_id}`}</Text>
          <Text style={styles.userPhone}>{item.user?.phone || 'Phone N/A'}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.amount}>₹{item.amount.toFixed(2)}</Text>
          <Text style={styles.date}>{new Date(item.timestamp).toLocaleDateString()}</Text>
        </View>
      </View>

      <TouchableOpacity 
        style={styles.approveBtn} 
        onPress={() => approveRequest(item.id)}
      >
        <Text style={styles.approveBtnText}>Approve Funds</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Wallet Recharges</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{requests.length} Pending</Text>
        </View>
      </View>
      
      {loading ? (
        <Text style={styles.loadingText}>Loading requests...</Text>
      ) : requests.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyTitle}>No pending recharges!</Text>
          <Text style={styles.emptySubtitle}>All caught up.</Text>
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={item => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0f172a',
  },
  badge: {
    backgroundColor: '#d1fae5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeText: {
    color: '#065f46',
    fontWeight: 'bold',
    fontSize: 12,
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 40,
    color: '#64748b',
    fontWeight: 'bold',
  },
  emptyBox: {
    backgroundColor: '#fff',
    padding: 40,
    borderRadius: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#f1f5f9',
    borderStyle: 'dashed',
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#94a3b8',
    marginBottom: 8,
  },
  emptySubtitle: {
    color: '#cbd5e1',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  userName: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
  },
  userPhone: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#64748b',
    marginTop: 4,
  },
  amount: {
    fontSize: 22,
    fontWeight: '900',
    color: '#10b981',
  },
  date: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#94a3b8',
    marginTop: 4,
  },
  approveBtn: {
    backgroundColor: '#0f172a',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  approveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
  }
});
