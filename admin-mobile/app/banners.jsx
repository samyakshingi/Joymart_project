import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, Modal, TextInput, Alert, ActivityIndicator, Switch } from 'react-native';
import { api } from '../api';

export default function Banners() {
  const [banners, setBanners] = useState([]);
  const [products, setProducts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [newBanner, setNewBanner] = useState({
    image_url: '',
    linked_product_id: '',
    is_active: true
  });

  const fetchData = async () => {
    try {
      const bannerRes = await api.get('/admin/banners');
      setBanners(bannerRes.data);
      const productRes = await api.get('/products');
      setProducts(productRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async () => {
    if (!newBanner.image_url) return;
    try {
      const payload = {
        ...newBanner,
        linked_product_id: newBanner.linked_product_id ? parseInt(newBanner.linked_product_id) : null
      };
      await api.post('/banners', payload);
      setIsModalOpen(false);
      setNewBanner({ image_url: '', linked_product_id: '', is_active: true });
      fetchData();
    } catch (err) {
      Alert.alert("Error", "Failed to create banner");
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    try {
      await api.put(`/banners/${id}/status?is_active=${!currentStatus}`);
      fetchData();
    } catch (err) {
      Alert.alert("Error", "Failed to update status");
    }
  };

  const handleDelete = async (id) => {
    Alert.alert("Delete Banner", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
          try {
            await api.delete(`/banners/${id}`);
            fetchData();
          } catch (err) {
            Alert.alert("Error", "Failed to delete");
          }
        }
      }
    ]);
  };

  if (isLoading) return <ActivityIndicator size="large" color="#10b981" style={{ flex: 1 }} />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Banners</Text>
          <Text style={styles.subtitle}>Home screen promotions</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setIsModalOpen(true)}>
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {banners.map(banner => (
          <View key={banner.id} style={[styles.card, !banner.is_active && styles.cardInactive]}>
            <Image source={{ uri: banner.image_url }} style={styles.bannerImg} />
            <View style={styles.cardInfo}>
              <Text style={styles.cardLabel}>LINKED PRODUCT</Text>
              <Text style={styles.cardValue}>
                {banner.linked_product_id 
                  ? products.find(p => p.id === banner.linked_product_id)?.name || "Linked"
                  : "None"}
              </Text>
              <View style={styles.cardActions}>
                <View style={styles.toggleRow}>
                  <Switch 
                    value={banner.is_active} 
                    onValueChange={() => toggleStatus(banner.id, banner.is_active)}
                    trackColor={{ false: '#e2e8f0', true: '#10b981' }}
                  />
                  <Text style={styles.statusText}>{banner.is_active ? 'Active' : 'Hidden'}</Text>
                </View>
                <TouchableOpacity onPress={() => handleDelete(banner.id)}>
                  <Text style={styles.deleteText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      <Modal visible={isModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Banner</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Image URL</Text>
              <TextInput 
                style={styles.input} 
                value={newBanner.image_url} 
                onChangeText={(v) => setNewBanner({...newBanner, image_url: v})}
                placeholder="https://..."
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Linked Product (ID)</Text>
              <TextInput 
                style={styles.input} 
                keyboardType="numeric"
                value={newBanner.linked_product_id} 
                onChangeText={(v) => setNewBanner({...newBanner, linked_product_id: v})}
                placeholder="Enter Product ID"
              />
            </View>
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsModalOpen(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleCreate}>
                <Text style={styles.saveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 40, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  title: { fontSize: 24, fontWeight: '900', color: '#0f172a' },
  subtitle: { fontSize: 12, fontWeight: 'bold', color: '#64748b' },
  addBtn: { backgroundColor: '#10b981', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 },
  addBtnText: { color: '#fff', fontWeight: 'bold' },
  list: { padding: 16 },
  card: { backgroundColor: '#fff', borderRadius: 20, marginBottom: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#e2e8f0' },
  cardInactive: { opacity: 0.6 },
  bannerImg: { width: '100%', height: 120, resizeMode: 'cover' },
  cardInfo: { padding: 16 },
  cardLabel: { fontSize: 10, fontWeight: '900', color: '#94a3b8', letterSpacing: 1, marginBottom: 4 },
  cardValue: { fontSize: 14, fontWeight: 'bold', color: '#1e293b', marginBottom: 12 },
  cardActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 12 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusText: { fontSize: 12, fontWeight: 'bold', color: '#64748b' },
  deleteText: { color: '#ef4444', fontWeight: 'bold', fontSize: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 24, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: '#0f172a', marginBottom: 20 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 12, fontWeight: 'bold', color: '#64748b', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 12, fontSize: 14, backgroundColor: '#f8fafc' },
  modalBtns: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: '#f1f5f9', alignItems: 'center' },
  cancelText: { fontWeight: 'bold', color: '#64748b' },
  saveBtn: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: '#0f172a', alignItems: 'center' },
  saveText: { fontWeight: 'bold', color: '#fff' }
});
