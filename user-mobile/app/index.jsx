import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, Image, StyleSheet, ActivityIndicator, FlatList } from 'react-native';
import { api } from '../api';
import { useStore } from '../store';

export default function Home() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState({});
  const [activeCategory, setActiveCategory] = useState('All');
  const [isLoading, setIsLoading] = useState(true);
  const [frequentProducts, setFrequentProducts] = useState([]);
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

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
  }, [user.phone]);

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
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.heroBanner}>
        <Text style={styles.heroTag}>LIGHTNING FAST</Text>
        <Text style={styles.heroTitle}>Groceries delivered in <Text style={styles.heroHighlight}>minutes.</Text></Text>
      </View>

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
            <Text style={[styles.categoryBtnText, activeCategory === cat && styles.activeCategoryBtnText]}>{cat}</Text>
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
  noProductsText: { textAlign: 'center', color: '#94a3b8', fontWeight: 'bold', padding: 20, width: '100%' }
});
