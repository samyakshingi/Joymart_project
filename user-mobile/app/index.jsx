import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, Image, StyleSheet, ActivityIndicator, FlatList, Dimensions, Modal, Alert } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
import { api } from '../api';
import { useStore } from '../store';
import { useTranslation } from 'react-i18next';

export default function Home() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState({});
  const [activeCategory, setActiveCategory] = useState('All');
  const [isLoading, setIsLoading] = useState(true);
  const [frequentProducts, setFrequentProducts] = useState([]);
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [banners, setBanners] = useState([]);
  const [subModalProduct, setSubModalProduct] = useState(null);
  const [subForm, setSubForm] = useState({ frequency: 'Daily', quantity: 1 });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const scrollViewRef = React.useRef(null);
  const { t } = useTranslation();

  const { cart, addToCart, decreaseQuantity, user } = useStore();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await api.get(`/products`);
        const available = response.data.filter(p => p.is_available);
        
        const grouped = available.reduce((acc, product) => {
          if (!acc[product.category]) acc[product.category] = [];
          acc[product.category].push(product);
          return acc;
        }, {});
        
        setCategories(grouped);
        setProducts(available);
        
        if (user.phone) {
          try {
            const freqRes = await api.get(`/orders/frequent/${user.phone}`);
            setFrequentProducts(freqRes.data.filter(p => p.is_available));
          } catch(err) {}
        }

        try {
          const trendRes = await api.get(`/products/trending`);
          setTrendingProducts(trendRes.data.filter(p => p.is_available));
        } catch(err) {}
      } catch (error) {
        console.error('Failed to fetch products');
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();

    const fetchBanners = async () => {
      try {
        const res = await api.get('/banners');
        setBanners(res.data);
      } catch(err) {}
    };
    fetchBanners();
  }, [user.phone]);

  const scrollToProduct = (productId) => {
    // Note: Since we are in a ScrollView with a map-based grid, we can't easily scroll to a specific index.
    // However, we can use the search query as a 'focus' mechanism or just show an alert if not found.
    // In a real app, we'd use a SectionList or similar. For now, we'll try to find the category and filter.
    const product = products.find(p => p.id === productId);
    if (product) {
      setActiveCategory(product.category);
      // We'll give it a moment to render then scroll to top (simplest way in this architecture)
      scrollViewRef.current?.scrollTo({ y: 500, animated: true });
    }
  };

  const handleSubscribe = async () => {
    if (!subModalProduct || !user?.phone) {
      Alert.alert('Error', 'Please login first to subscribe.');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const userRes = await api.get(`/users/${user.phone}`);
      await api.post(`/subscriptions`, {
        user_id: userRes.data.id,
        product_id: subModalProduct.id,
        frequency: subForm.frequency,
        quantity: parseInt(subForm.quantity)
      });
      Alert.alert('Success', 'Subscription created successfully!');
      setSubModalProduct(null);
      setSubForm({ frequency: 'Daily', quantity: 1 });
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to create subscription.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getQuantityInCart = (productId) => {
    const item = cart.find(i => i.product.id === productId);
    return item ? item.quantity : 0;
  };

  const categoryNames = ['All', ...Object.keys(categories)];
  
  const displayedProducts = (activeCategory === 'All' 
    ? products 
    : categories[activeCategory] || []
  ).filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const renderProductCard = ({ item: product, isCarousel = false }) => {
    const qty = getQuantityInCart(product.id);
    return (
      <View style={[styles.productCard, isCarousel && styles.carouselCard]}>
        <View style={styles.imageContainer}>
          {product.image_url ? (
            <Image source={{ uri: product.image_url }} style={styles.productImage} resizeMode="contain" />
          ) : (
            <View style={styles.placeholderImage}>
              <Text style={styles.placeholderText}>?</Text>
            </View>
          )}
        </View>
        <View style={styles.productInfo}>
          <View>
            <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
            <Text style={styles.productCategory}>{product.category}</Text>
          </View>
          <View style={styles.priceRow}>
            <View>
              {product.discounted_price ? (
                <>
                  <Text style={styles.originalPrice}>₹{product.price}</Text>
                  <Text style={styles.productPrice}>₹{product.discounted_price}</Text>
                </>
              ) : (
                <Text style={styles.productPrice}>₹{product.price}</Text>
              )}
            </View>
            {qty === 0 ? (
              <TouchableOpacity onPress={() => addToCart(product)} style={styles.addButton}>
                <Text style={styles.addButtonText}>+</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.qtyContainer}>
                <TouchableOpacity onPress={() => decreaseQuantity(product.id)} style={styles.qtyBtn}>
                  <Text style={styles.qtyBtnText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.qtyText}>{qty}</Text>
                <TouchableOpacity onPress={() => addToCart(product)} style={styles.qtyBtn}>
                  <Text style={styles.qtyBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
          <TouchableOpacity 
            style={styles.subscribeBtnCard}
            onPress={() => setSubModalProduct(product)}
          >
            <Text style={styles.subscribeBtnCardText}>SUBSCRIBE</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  return (
    <ScrollView 
      ref={scrollViewRef}
      style={styles.container} 
      contentContainerStyle={styles.contentContainer} 
      showsVerticalScrollIndicator={false}
    >
      {/* Banner Carousel */}
      {banners.length > 0 ? (
        <View style={styles.carouselContainer}>
          <FlatList
            horizontal
            pagingEnabled
            data={banners}
            keyExtractor={(item) => item.id.toString()}
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity 
                activeOpacity={0.9}
                onPress={() => item.linked_product_id && scrollToProduct(item.linked_product_id)}
                style={styles.bannerItem}
              >
                <Image source={{ uri: item.image_url }} style={styles.bannerImage} />
              </TouchableOpacity>
            )}
          />
        </View>
      ) : (
        <View style={styles.heroBanner}>
          <Text style={styles.heroTag}>LIGHTNING FAST</Text>
          <Text style={styles.heroTitle}>Groceries delivered in <Text style={styles.heroHighlight}>minutes.</Text></Text>
        </View>
      )}

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search for groceries..."
          placeholderTextColor="#94a3b8"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {frequentProducts.length > 0 && searchQuery === '' && activeCategory === 'All' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Buy It Again</Text>
          <FlatList
            horizontal
            data={frequentProducts}
            keyExtractor={(item) => item.id.toString()}
            renderItem={(props) => renderProductCard({ ...props, isCarousel: true })}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          />
        </View>
      )}

      {trendingProducts.length > 0 && searchQuery === '' && activeCategory === 'All' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trending Now</Text>
          <FlatList
            horizontal
            data={trendingProducts}
            keyExtractor={(item) => item.id.toString()}
            renderItem={(props) => renderProductCard({ ...props, isCarousel: true })}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          />
        </View>
      )}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesContainer} contentContainerStyle={styles.categoriesContent}>
        {categoryNames.map(cat => (
          <TouchableOpacity
            key={cat}
            style={[styles.categoryBtn, activeCategory === cat && styles.activeCategoryBtn]}
            onPress={() => setActiveCategory(cat)}
          >
            <Text style={[styles.categoryBtnText, activeCategory === cat && styles.activeCategoryBtnText]}>
              {cat === 'All' ? t('Categories') || 'All' : cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.productsGrid}>
        {displayedProducts.length === 0 ? (
          <Text style={styles.noProductsText}>No products found.</Text>
        ) : (
          displayedProducts.map(p => (
            <View key={p.id} style={styles.gridItem}>
              {renderProductCard({ item: p, isCarousel: false })}
            </View>
          ))
        )}
      </View>

      {/* Subscription Modal */}
      <Modal visible={!!subModalProduct} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Subscribe</Text>
                <Text style={styles.modalSubtitle} numberOfLines={1}>{subModalProduct?.name}</Text>
              </View>
              <TouchableOpacity onPress={() => setSubModalProduct(null)}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              <View style={styles.subInfoBox}>
                <Text style={styles.subInfoText}>Subscriptions are deducted from your JoyMart Wallet automatically.</Text>
              </View>

              <Text style={styles.subLabel}>FREQUENCY</Text>
              <View style={styles.subFreqRow}>
                {['Daily', 'Weekly'].map(freq => (
                  <TouchableOpacity
                    key={freq}
                    style={[styles.subFreqBtn, subForm.frequency === freq && styles.subFreqBtnActive]}
                    onPress={() => setSubForm({...subForm, frequency: freq})}
                  >
                    <Text style={[styles.subFreqText, subForm.frequency === freq && styles.subFreqTextActive]}>{freq}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.subLabel}>QUANTITY PER DELIVERY</Text>
              <View style={styles.subQtyRow}>
                <TouchableOpacity style={styles.subQtyBtn} onPress={() => setSubForm(p => ({...p, quantity: Math.max(1, p.quantity - 1)}))}>
                  <Text style={styles.subQtyBtnText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.subQtyValue}>{subForm.quantity}</Text>
                <TouchableOpacity style={styles.subQtyBtn} onPress={() => setSubForm(p => ({...p, quantity: p.quantity + 1}))}>
                  <Text style={styles.subQtyBtnText}>+</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.subCostRow}>
                <Text style={styles.subCostLabel}>Estimated Cost</Text>
                <Text style={styles.subCostValue}>₹{((subModalProduct?.discounted_price || subModalProduct?.price || 0) * subForm.quantity).toFixed(2)} / {subForm.frequency.toLowerCase()}</Text>
              </View>

              <TouchableOpacity 
                style={[styles.subSubmitBtn, isSubmitting && styles.subSubmitBtnDisabled]}
                onPress={handleSubscribe}
                disabled={isSubmitting}
              >
                {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.subSubmitText}>Confirm Subscription</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  contentContainer: { padding: 16, paddingBottom: 100 },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  heroBanner: {
    backgroundColor: '#0f172a',
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
  },
  heroTag: {
    color: '#34d399',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 16,
  },
  heroTitle: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '900',
    lineHeight: 40,
  },
  heroHighlight: { color: '#34d399' },
  carouselContainer: { height: 200, marginBottom: 24, borderRadius: 24, overflow: 'hidden' },
  bannerItem: { width: SCREEN_WIDTH - 32, height: 200 }, // 32 for padding
  bannerImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  searchContainer: { marginBottom: 24 },
  searchInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 20, fontWeight: '900', color: '#0f172a', marginBottom: 16 },
  horizontalList: { gap: 16, paddingRight: 16 },
  categoriesContainer: { marginBottom: 24 },
  categoriesContent: { gap: 8 },
  categoryBtn: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  activeCategoryBtn: { backgroundColor: '#0f172a', borderColor: '#0f172a' },
  categoryBtnText: { fontWeight: 'bold', color: '#64748b' },
  activeCategoryBtnText: { color: '#fff' },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItem: { width: '48%', marginBottom: 16 },
  productCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    overflow: 'hidden',
    flex: 1,
  },
  carouselCard: { width: 160 },
  imageContainer: { height: 120, backgroundColor: '#f8fafc', padding: 16, justifyContent: 'center', alignItems: 'center' },
  productImage: { width: '100%', height: '100%' },
  placeholderImage: { width: 48, height: 48, backgroundColor: '#fff', borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  placeholderText: { color: '#cbd5e1', fontSize: 20, fontWeight: 'bold' },
  productInfo: { padding: 12, flex: 1, justifyContent: 'space-between' },
  productName: { fontSize: 14, fontWeight: 'bold', color: '#1e293b', marginBottom: 4 },
  productCategory: { fontSize: 10, fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 12 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  originalPrice: { fontSize: 12, color: '#94a3b8', textDecorationLine: 'line-through', marginBottom: -2 },
  productPrice: { fontSize: 18, fontWeight: '900', color: '#0f172a' },
  addButton: { width: 36, height: 36, backgroundColor: '#ecfdf5', borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  addButtonText: { color: '#10b981', fontSize: 20, fontWeight: '900' },
  qtyContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#10b981', borderRadius: 20, padding: 4 },
  qtyBtn: { width: 24, height: 24, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  qtyBtnText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  qtyText: { color: '#fff', fontWeight: '900', width: 24, textAlign: 'center' },
  noProductsText: { textAlign: 'center', color: '#94a3b8', fontWeight: 'bold', padding: 20, width: '100%' },
  subscribeBtnCard: { marginTop: 12, borderWidth: 1, borderColor: '#bfdbfe', borderRadius: 8, paddingVertical: 6, alignItems: 'center' },
  subscribeBtnCardText: { color: '#2563eb', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 16 },
  modalContent: { backgroundColor: '#fff', borderRadius: 24, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  modalTitle: { fontSize: 24, fontWeight: '900', color: '#0f172a' },
  modalSubtitle: { fontSize: 12, fontWeight: 'bold', color: '#64748b', marginTop: 4, maxWidth: '80%' },
  modalCloseText: { fontSize: 24, color: '#94a3b8', fontWeight: 'bold' },
  modalBody: { gap: 16 },
  subInfoBox: { backgroundColor: '#fffbeb', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#fde68a', marginBottom: 8 },
  subInfoText: { color: '#92400e', fontSize: 12, fontWeight: 'bold' },
  subLabel: { fontSize: 10, fontWeight: '900', color: '#94a3b8', letterSpacing: 1, marginBottom: -8 },
  subFreqRow: { flexDirection: 'row', gap: 12 },
  subFreqBtn: { flex: 1, borderWidth: 2, borderColor: '#f1f5f9', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  subFreqBtnActive: { borderColor: '#3b82f6', backgroundColor: '#eff6ff' },
  subFreqText: { color: '#64748b', fontWeight: '900', fontSize: 14 },
  subFreqTextActive: { color: '#2563eb' },
  subQtyRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  subQtyBtn: { width: 48, height: 48, backgroundColor: '#f1f5f9', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  subQtyBtnText: { color: '#475569', fontSize: 24, fontWeight: '900' },
  subQtyValue: { flex: 1, textAlign: 'center', fontSize: 24, fontWeight: '900', color: '#0f172a' },
  subCostRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', padding: 16, borderRadius: 16, marginTop: 8 },
  subCostLabel: { color: '#64748b', fontSize: 12, fontWeight: 'bold' },
  subCostValue: { color: '#0f172a', fontSize: 18, fontWeight: '900' },
  subSubmitBtn: { backgroundColor: '#2563eb', paddingVertical: 16, borderRadius: 16, alignItems: 'center', marginTop: 8 },
  subSubmitBtnDisabled: { opacity: 0.5 },
  subSubmitText: { color: '#fff', fontSize: 16, fontWeight: '900' }
});
