import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '../api';
import { useStore } from '../store';

export default function SmartLists() {
  const router = useRouter();
  const { user, setCart } = useStore();
  const [profile, setProfile] = useState(null);
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userRes = await api.get(`/users/${user.phone}`);
        setProfile(userRes.data);
        
        const listsRes = await api.get(`/users/${userRes.data.id}/saved-lists`);
        setLists(listsRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (user?.phone) fetchData();
  }, [user]);

  const addListToCart = (list) => {
    try {
      const newCart = list.items.map(item => ({
        product: item.product,
        quantity: item.quantity
      }));
      setCart(newCart);
      router.push('/checkout');
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to load list into cart');
    }
  };

  const deleteList = async (listId) => {
    Alert.alert(
      "Delete List",
      "Are you sure you want to delete this list?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              await api.delete(`/saved-lists/${listId}`);
              setLists(prev => prev.filter(l => l.id !== listId));
            } catch (err) {
              console.error(err);
              Alert.alert('Error', 'Failed to delete list');
            }
          }
        }
      ]
    );
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.listName}>{item.list_name}</Text>
          <Text style={styles.listCount}>{item.items.length} items</Text>
        </View>
        <TouchableOpacity style={styles.deleteBtn} onPress={() => deleteList(item.id)}>
          <Text style={styles.deleteBtnText}>✕</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.previewBox}>
        {item.items.slice(0, 3).map((listItem, idx) => (
          <Text key={listItem.id || idx} style={styles.previewText} numberOfLines={1}>
            {listItem.quantity}x {listItem.product?.name || 'Unknown'}
          </Text>
        ))}
        {item.items.length > 3 && (
          <Text style={styles.moreText}>+{item.items.length - 3} more items...</Text>
        )}
      </View>

      <TouchableOpacity 
        style={styles.addBtn}
        onPress={() => addListToCart(item)}
      >
        <Text style={styles.addBtnText}>Add List to Cart</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Smart Lists</Text>

      {lists.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyIcon}>📝</Text>
          <Text style={styles.emptyTitle}>No Saved Lists</Text>
          <Text style={styles.emptySubtitle}>You can save your current cart as a list from the Checkout screen!</Text>
        </View>
      ) : (
        <FlatList
          data={lists}
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
  headerTitle: { fontSize: 28, fontWeight: '900', color: '#0f172a', marginBottom: 20 },
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
    borderColor: '#f1f5f9',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
    paddingBottom: 16,
  },
  listName: { fontSize: 20, fontWeight: '900', color: '#0f172a' },
  listCount: { fontSize: 12, fontWeight: 'bold', color: '#94a3b8', marginTop: 4 },
  deleteBtn: {
    backgroundColor: '#fef2f2',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnText: { color: '#ef4444', fontWeight: '900', fontSize: 14 },
  previewBox: { marginBottom: 20, gap: 6 },
  previewText: { fontSize: 14, fontWeight: 'bold', color: '#475569' },
  moreText: { fontSize: 12, fontWeight: 'bold', color: '#94a3b8', marginTop: 4 },
  addBtn: {
    backgroundColor: '#0f172a',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  addBtnText: { color: '#fff', fontSize: 16, fontWeight: '900' }
});
