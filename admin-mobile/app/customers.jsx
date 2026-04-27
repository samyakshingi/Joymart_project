import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { api } from '../api';

export default function Customers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const toggleBlockStatus = async (userId) => {
    try {
      const res = await api.put(`/admin/users/${userId}/block`);
      setUsers(users.map(u => u.id === userId ? { ...u, is_blocked: res.data.is_blocked } : u));
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to toggle user block status');
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.phone}>{item.phone}</Text>
        </View>
        <View style={[styles.roleBadge, item.role === 'Admin' ? styles.adminBadge : null]}>
          <Text style={styles.roleText}>{item.role}</Text>
        </View>
      </View>
      
      <View style={styles.metaRow}>
        <Text style={styles.metaLabel}>ID: <Text style={styles.metaValue}>{item.id}</Text></Text>
        <Text style={styles.metaLabel}>Wallet: <Text style={styles.metaValue}>₹{item.wallet_balance}</Text></Text>
        <View style={styles.statusBadge}>
          {item.is_blocked ? (
            <Text style={styles.statusBlocked}>● Blocked</Text>
          ) : (
            <Text style={styles.statusActive}>● Active</Text>
          )}
        </View>
      </View>

      <TouchableOpacity 
        style={[styles.btn, item.is_blocked ? styles.btnUnblock : styles.btnBlock]}
        onPress={() => toggleBlockStatus(item.id)}
      >
        <Text style={[styles.btnText, item.is_blocked ? styles.textUnblock : styles.textBlock]}>
          {item.is_blocked ? 'Unblock User' : 'Block User'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Customers Management</Text>
        <Text style={styles.subtitle}>Manage all registered users</Text>
      </View>
      
      {loading ? (
        <ActivityIndicator size="large" color="#10b981" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  header: { padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  title: { fontSize: 24, fontWeight: '900', color: '#0f172a' },
  subtitle: { fontSize: 14, color: '#64748b', marginTop: 4 },
  listContainer: { padding: 16, gap: 16 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  name: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
  phone: { fontSize: 14, color: '#64748b', marginTop: 2 },
  roleBadge: { backgroundColor: '#dbeafe', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  adminBadge: { backgroundColor: '#f3e8ff' },
  roleText: { fontSize: 12, fontWeight: 'bold', color: '#1e40af' },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', padding: 12, borderRadius: 12, marginBottom: 16 },
  metaLabel: { fontSize: 12, color: '#64748b', fontWeight: '600' },
  metaValue: { color: '#0f172a', fontWeight: 'bold' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, backgroundColor: '#fff' },
  statusActive: { fontSize: 12, fontWeight: 'bold', color: '#10b981' },
  statusBlocked: { fontSize: 12, fontWeight: 'bold', color: '#ef4444' },
  btn: { paddingVertical: 12, borderRadius: 12, alignItems: 'center', borderWidth: 1 },
  btnBlock: { backgroundColor: '#fef2f2', borderColor: '#fecaca' },
  btnUnblock: { backgroundColor: '#ecfdf5', borderColor: '#a7f3d0' },
  textBlock: { color: '#b91c1c', fontWeight: 'bold' },
  textUnblock: { color: '#047857', fontWeight: 'bold' }
});
