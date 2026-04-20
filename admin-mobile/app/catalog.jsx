import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, Image, StyleSheet, Alert, useWindowDimensions, RefreshControl, Modal } from 'react-native';
import { api } from '../api';

export default function Catalog() {
  const [products, setProducts] = useState([]);
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    discounted_price: '',
    category: '',
    image_url: '',
    stock_count: '0'
  });
  const [editingProduct, setEditingProduct] = useState(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { width } = useWindowDimensions();
  const isTablet = width > 768;

  const fetchProducts = async () => {
    try {
      const response = await api.get(`/products`);
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProducts();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const toggleAvailability = async (product) => {
    try {
      await api.put(`/products/${product.id}/availability?is_available=${!product.is_available}`);
      fetchProducts();
    } catch (error) {
      console.error('Error toggling availability:', error);
    }
  };

  const updateStock = async (product, newStockCount) => {
    try {
      await api.put(`/products/${product.id}/stock?stock_count=${newStockCount}`);
      fetchProducts();
    } catch (error) {
      console.error('Error updating stock:', error);
    }
  };

  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.price || !newProduct.category) {
      Alert.alert("Error", "Please fill required fields.");
      return;
    }
    setIsSubmitting(true);
    try {
      await api.post(`/products`, {
        ...newProduct,
        price: parseFloat(newProduct.price),
        discounted_price: newProduct.discounted_price ? parseFloat(newProduct.discounted_price) : null,
        stock_count: parseInt(newProduct.stock_count) || 0
      });
      setNewProduct({ name: '', price: '', discounted_price: '', category: '', image_url: '', stock_count: '0' });
      fetchProducts();
      Alert.alert("Success", "Product added successfully");
    } catch (error) {
      console.error('Error adding product:', error);
      Alert.alert("Error", "Failed to add product.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateProduct = async () => {
    if (!editingProduct.name || !editingProduct.price) {
      Alert.alert("Error", "Please fill required fields.");
      return;
    }
    setIsSubmitting(true);
    try {
      await api.put(`/products/${editingProduct.id}`, {
        ...editingProduct,
        price: parseFloat(editingProduct.price),
        discounted_price: editingProduct.discounted_price ? parseFloat(editingProduct.discounted_price) : null,
        stock_count: parseInt(editingProduct.stock_count) || 0
      });
      setIsEditModalVisible(false);
      setEditingProduct(null);
      fetchProducts();
      Alert.alert("Success", "Product updated successfully");
    } catch (error) {
      console.error('Error updating product:', error);
      Alert.alert("Error", "Failed to update product.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.contentContainer}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.formCard}>
        <View style={styles.formHeader}>
          <Text style={styles.formTitle}>Add New Product</Text>
        </View>
        <View style={[styles.formGrid, isTablet && styles.formGridTablet]}>
          <View style={[styles.inputGroup, isTablet && styles.inputGroupTablet]}>
            <Text style={styles.label}>Product Name</Text>
            <TextInput style={styles.input} value={newProduct.name} onChangeText={(v) => setNewProduct({...newProduct, name: v})} placeholder="e.g. Farm Fresh Milk 1L" />
          </View>
          <View style={[styles.inputGroup, isTablet && styles.inputGroupTablet]}>
            <Text style={styles.label}>Price (₹)</Text>
            <TextInput style={styles.input} keyboardType="numeric" value={newProduct.price} onChangeText={(v) => setNewProduct({...newProduct, price: v})} placeholder="60.00" />
          </View>
          <View style={[styles.inputGroup, isTablet && styles.inputGroupTablet]}>
            <Text style={styles.label}>Disc. Price (₹)</Text>
            <TextInput style={styles.input} keyboardType="numeric" value={newProduct.discounted_price} onChangeText={(v) => setNewProduct({...newProduct, discounted_price: v})} placeholder="50.00" />
          </View>
          <View style={[styles.inputGroup, isTablet && styles.inputGroupTablet]}>
            <Text style={styles.label}>Category</Text>
            <TextInput style={styles.input} value={newProduct.category} onChangeText={(v) => setNewProduct({...newProduct, category: v})} placeholder="Dairy" />
          </View>
          <View style={[styles.inputGroup, isTablet && styles.inputGroupTablet]}>
            <Text style={styles.label}>Image URL (Cloudinary)</Text>
            <TextInput style={styles.input} value={newProduct.image_url} onChangeText={(v) => setNewProduct({...newProduct, image_url: v})} placeholder="https://..." />
          </View>
          <View style={[styles.inputGroup, isTablet && styles.inputGroupTablet]}>
            <Text style={styles.label}>Stock Count</Text>
            <TextInput style={styles.input} keyboardType="numeric" value={newProduct.stock_count} onChangeText={(v) => setNewProduct({...newProduct, stock_count: v})} placeholder="0" />
          </View>
          <TouchableOpacity 
            style={[styles.submitBtn, isTablet && styles.submitBtnTablet, isSubmitting && styles.submitBtnDisabled]}
            disabled={isSubmitting}
            onPress={handleAddProduct}
          >
            <Text style={styles.submitBtnText}>{isSubmitting ? 'Adding...' : '+ Add to Catalog'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>Store Catalog</Text>
        <View style={styles.listBadge}>
          <Text style={styles.listBadgeText}>{products.length} Products Total</Text>
        </View>
      </View>

      {products.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>Your catalog is empty.</Text>
        </View>
      ) : (
        <View style={styles.grid}>
          {products.map(product => (
            <View key={product.id} style={[styles.productCard, isTablet ? styles.productCardTablet : styles.productCardMobile, !product.is_available && styles.productCardUnavailable]}>
              <View style={styles.imageContainer}>
                {!product.is_available && (
                  <View style={styles.outOfStockOverlay}>
                    <Text style={styles.outOfStockText}>OUT OF STOCK</Text>
                  </View>
                )}
                {product.image_url ? (
                  <Image source={{ uri: product.image_url }} style={[styles.productImage, !product.is_available && styles.imageGrayscale]} resizeMode="contain" />
                ) : (
                  <View style={styles.placeholderImg}>
                    <Text style={styles.placeholderText}>?</Text>
                  </View>
                )}
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryBadgeText}>{product.category}</Text>
                </View>
              </View>

              <View style={styles.productInfo}>
                <View style={styles.infoTop}>
                  <Text style={[styles.productName, !product.is_available && styles.textMuted]} numberOfLines={2}>{product.name}</Text>
                  <View style={{ alignItems: 'flex-end' }}>
                    {product.discounted_price ? (
                      <>
                        <Text style={[styles.originalPrice, !product.is_available && styles.textMuted]}>₹{product.price}</Text>
                        <Text style={[styles.productPrice, !product.is_available && styles.textMuted]}>₹{product.discounted_price}</Text>
                      </>
                    ) : (
                      <Text style={[styles.productPrice, !product.is_available && styles.textMuted]}>₹{product.price}</Text>
                    )}
                  </View>
                </View>

                <TouchableOpacity 
                  onPress={() => {
                    setEditingProduct({
                      ...product, 
                      price: product.price.toString(), 
                      discounted_price: product.discounted_price ? product.discounted_price.toString() : '', 
                      stock_count: product.stock_count.toString(),
                      image_url: product.image_url || ''
                    });
                    setIsEditModalVisible(true);
                  }}
                  style={styles.editLink}
                >
                  <Text style={styles.editLinkText}>✎ Edit Details</Text>
                </TouchableOpacity>

                <View style={styles.stockController}>
                  <Text style={styles.stockLabel}>Stock:</Text>
                  <View style={styles.stockActions}>
                    <TouchableOpacity onPress={() => updateStock(product, Math.max(0, product.stock_count - 1))} style={styles.stockBtn}>
                      <Text style={styles.stockBtnText}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.stockValue}>{product.stock_count}</Text>
                    <TouchableOpacity onPress={() => updateStock(product, product.stock_count + 1)} style={styles.stockBtn}>
                      <Text style={styles.stockBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity 
                  onPress={() => toggleAvailability(product)}
                  style={[styles.toggleBtn, product.is_available ? styles.btnAvailable : styles.btnUnavailable]}
                >
                  <Text style={[styles.toggleBtnText, product.is_available ? styles.textAvailable : styles.textUnavailable]}>
                    {product.is_available ? 'Mark as Out of Stock' : 'Mark as Available'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Edit Modal */}
      <Modal visible={isEditModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Product</Text>
            {editingProduct && (
              <View style={styles.formGrid}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Product Name</Text>
                  <TextInput style={styles.input} value={editingProduct.name} onChangeText={(v) => setEditingProduct({...editingProduct, name: v})} />
                </View>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Price (₹)</Text>
                    <TextInput style={styles.input} keyboardType="numeric" value={editingProduct.price} onChangeText={(v) => setEditingProduct({...editingProduct, price: v})} />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Disc. Price (₹)</Text>
                    <TextInput style={styles.input} keyboardType="numeric" value={editingProduct.discounted_price} onChangeText={(v) => setEditingProduct({...editingProduct, discounted_price: v})} />
                  </View>
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Stock Count</Text>
                  <TextInput style={styles.input} keyboardType="numeric" value={editingProduct.stock_count} onChangeText={(v) => setEditingProduct({...editingProduct, stock_count: v})} />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Image URL</Text>
                  <TextInput style={styles.input} value={editingProduct.image_url} onChangeText={(v) => setEditingProduct({...editingProduct, image_url: v})} placeholder="https://example.com/image.png" />
                </View>
                <View style={styles.modalActions}>
                  <TouchableOpacity style={[styles.modalBtn, styles.cancelBtn]} onPress={() => setIsEditModalVisible(false)}>
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.modalBtn, styles.saveBtn]} onPress={handleUpdateProduct}>
                    <Text style={styles.saveBtnText}>Save Changes</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  contentContainer: { padding: 16 },
  formCard: { backgroundColor: '#fff', borderRadius: 24, padding: 20, marginBottom: 32, borderWidth: 1, borderColor: '#e2e8f0' },
  formHeader: { marginBottom: 16 },
  formTitle: { fontSize: 20, fontWeight: '900', color: '#0f172a' },
  formGrid: { gap: 16 },
  formGridTablet: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-end' },
  inputGroup: { flex: 1 },
  inputGroupTablet: { minWidth: '30%', flex: 1 },
  label: { fontSize: 12, fontWeight: 'bold', color: '#475569', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 12, padding: 12, fontSize: 14, backgroundColor: '#f8fafc' },
  submitBtn: { backgroundColor: '#0f172a', padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  submitBtnTablet: { flex: 1, minWidth: '20%', marginBottom: 2 },
  submitBtnDisabled: { opacity: 0.7 },
  submitBtnText: { color: '#fff', fontWeight: 'bold' },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  listTitle: { fontSize: 24, fontWeight: '900', color: '#0f172a' },
  listBadge: { backgroundColor: '#e2e8f0', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  listBadgeText: { fontWeight: 'bold', color: '#475569', fontSize: 12 },
  emptyBox: { backgroundColor: '#fff', padding: 40, borderRadius: 24, alignItems: 'center', borderWidth: 2, borderColor: '#e2e8f0', borderStyle: 'dashed' },
  emptyText: { color: '#64748b', fontWeight: 'bold', fontSize: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  productCard: { backgroundColor: '#fff', borderRadius: 20, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 16, overflow: 'hidden' },
  productCardMobile: { width: '100%' },
  productCardTablet: { width: '48%' },
  productCardUnavailable: { backgroundColor: '#f8fafc', borderColor: '#fecaca' },
  imageContainer: { height: 160, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center', position: 'relative' },
  productImage: { width: '100%', height: '100%' },
  imageGrayscale: { opacity: 0.5 },
  placeholderImg: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#e2e8f0', justifyContent: 'center', alignItems: 'center' },
  placeholderText: { fontSize: 20, color: '#94a3b8', fontWeight: 'bold' },
  outOfStockOverlay: { position: 'absolute', zIndex: 10, backgroundColor: 'rgba(255,255,255,0.7)', ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  outOfStockText: { backgroundColor: '#ef4444', color: '#fff', paddingHorizontal: 16, paddingVertical: 4, borderRadius: 16, fontWeight: '900', transform: [{ rotate: '-12deg' }] },
  categoryBadge: { position: 'absolute', top: 12, left: 12, backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  categoryBadgeText: { fontSize: 10, fontWeight: 'bold', color: '#334155' },
  productInfo: { padding: 16 },
  infoTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  productName: { fontSize: 16, fontWeight: 'bold', color: '#0f172a', flex: 1, marginRight: 8 },
  originalPrice: { fontSize: 12, color: '#94a3b8', textDecorationLine: 'line-through' },
  productPrice: { fontSize: 18, fontWeight: '900', color: '#059669' },
  editLink: { marginBottom: 12 },
  editLinkText: { color: '#2563eb', fontWeight: 'bold', fontSize: 12 },
  textMuted: { color: '#94a3b8' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', width: '100%', maxWidth: 500, borderRadius: 24, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: '#0f172a', marginBottom: 20 },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  modalBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  cancelBtn: { backgroundColor: '#f1f5f9' },
  cancelBtnText: { color: '#475569', fontWeight: 'bold' },
  saveBtn: { backgroundColor: '#0f172a' },
  saveBtnText: { color: '#fff', fontWeight: 'bold' },
  stockController: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', padding: 8, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 16 },
  stockLabel: { fontSize: 14, fontWeight: 'bold', color: '#475569', marginLeft: 4 },
  stockActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stockBtn: { width: 28, height: 28, backgroundColor: '#fff', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  stockBtnText: { fontWeight: 'bold', color: '#475569' },
  stockValue: { width: 32, textAlign: 'center', fontWeight: '900', color: '#0f172a' },
  toggleBtn: { paddingVertical: 12, borderRadius: 12, alignItems: 'center', borderWidth: 1 },
  btnAvailable: { backgroundColor: '#f8fafc', borderColor: 'transparent' },
  btnUnavailable: { backgroundColor: '#10b981', borderColor: '#059669' },
  textAvailable: { color: '#334155', fontWeight: 'bold' },
  textUnavailable: { color: '#fff', fontWeight: 'bold' }
});
