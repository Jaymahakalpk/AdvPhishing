import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { useCartStore } from '../../src/store/cartStore';
import { getShop, getProducts } from '../../src/utils/api';
import { translations } from '../../src/constants/translations';

export default function ShopDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const user = useAuthStore((state) => state.user);
  const { addItem, items: cartItems } = useCartStore();
  const lang = (user?.language_preference || 'en') as 'en' | 'hi' | 'gu' | 'or';
  const t = translations[lang];

  const [shop, setShop] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchShopData();
  }, [id]);

  const fetchShopData = async () => {
    setLoading(true);
    try {
      const [shopResponse, productsResponse] = await Promise.all([
        getShop(id as string),
        getProducts({ shop_id: id }),
      ]);
      setShop(shopResponse.data.shop);
      setProducts(productsResponse.data.products);
    } catch (error) {
      console.error('Fetch shop data error:', error);
      Alert.alert('Error', 'Failed to load shop details');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (product: any) => {
    addItem({
      product_id: product.id,
      product_name: product.name,
      price: product.price,
      quantity: 1,
      shop_id: shop.id,
      shop_name: shop.name,
    });
    Alert.alert('Success', `${product.name} added to cart`);
  };

  const isInCart = (productId: string) => {
    return cartItems.some(item => item.product_id === productId);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10b981" />
        </View>
      </SafeAreaView>
    );
  }

  if (!shop) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Shop not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Shop Details</Text>
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/cart')}
          style={styles.cartButton}
        >
          <Ionicons name="cart" size={24} color="#10b981" />
          {cartItems.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{cartItems.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Shop Info */}
        <View style={styles.shopCard}>
          <View style={styles.shopIcon}>
            <Ionicons name="storefront" size={48} color="#10b981" />
          </View>
          <Text style={styles.shopName}>{shop.name}</Text>
          <Text style={styles.shopCategory}>
            {t[shop.category as keyof typeof t] as string}
          </Text>
          <View style={styles.shopLocation}>
            <Ionicons name="location" size={16} color="#6b7280" />
            <Text style={styles.shopAddress}>{shop.address}</Text>
          </View>
          {shop.description && (
            <Text style={styles.shopDescription}>{shop.description}</Text>
          )}
        </View>

        {/* Products */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Products</Text>
          {products.length === 0 ? (
            <View style={styles.emptyProducts}>
              <Ionicons name="cube-outline" size={64} color="#d1d5db" />
              <Text style={styles.emptyText}>No products available</Text>
            </View>
          ) : (
            products.map((product) => (
              <View key={product.id} style={styles.productCard}>
                <View style={styles.productIcon}>
                  <Ionicons name="cube" size={32} color="#10b981" />
                </View>
                <View style={styles.productInfo}>
                  <Text style={styles.productName}>{product.name}</Text>
                  {product.description && (
                    <Text style={styles.productDescription} numberOfLines={2}>
                      {product.description}
                    </Text>
                  )}
                  <View style={styles.productFooter}>
                    <Text style={styles.productPrice}>₹{product.price.toFixed(2)}</Text>
                    <Text
                      style={[
                        styles.stockText,
                        product.stock_quantity < 10 && styles.stockLow,
                      ]}
                    >
                      {product.stock_quantity > 0
                        ? `Stock: ${product.stock_quantity}`
                        : 'Out of Stock'}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={[
                    styles.addButton,
                    (product.stock_quantity === 0 || isInCart(product.id)) &&
                      styles.addButtonDisabled,
                  ]}
                  onPress={() => handleAddToCart(product)}
                  disabled={product.stock_quantity === 0 || isInCart(product.id)}
                >
                  {isInCart(product.id) ? (
                    <Ionicons name="checkmark" size={24} color="#ffffff" />
                  ) : (
                    <Ionicons name="add" size={24} color="#ffffff" />
                  )}
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Floating Cart Button */}
      {cartItems.length > 0 && (
        <TouchableOpacity
          style={styles.floatingCartButton}
          onPress={() => router.push('/(tabs)/cart')}
        >
          <View style={styles.floatingCartContent}>
            <View>
              <Text style={styles.floatingCartText}>{cartItems.length} items</Text>
              <Text style={styles.floatingCartSubtext}>{t.viewCart}</Text>
            </View>
            <Ionicons name="arrow-forward" size={24} color="#ffffff" />
          </View>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    flex: 1,
    textAlign: 'center',
  },
  cartButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-end',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  shopCard: {
    backgroundColor: '#ffffff',
    padding: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  shopIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#d1fae5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  shopName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  shopCategory: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10b981',
    marginBottom: 12,
  },
  shopLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  shopAddress: {
    fontSize: 14,
    color: '#6b7280',
  },
  shopDescription: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  productIcon: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#d1fae5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 12,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  productDescription: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 8,
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10b981',
  },
  stockText: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '600',
  },
  stockLow: {
    color: '#f59e0b',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyProducts: {
    alignItems: 'center',
    padding: 48,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 16,
  },
  floatingCartButton: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: '#10b981',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  floatingCartContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  floatingCartText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  floatingCartSubtext: {
    fontSize: 14,
    color: '#d1fae5',
    marginTop: 2,
  },
});