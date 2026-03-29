import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { useAuthStore } from '../../src/store/authStore';
import { useCartStore } from '../../src/store/cartStore';
import { getShops, getVillages } from '../../src/utils/api';
import { translations } from '../../src/constants/translations';

export default function HomeScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const cartItems = useCartStore((state) => state.items);
  const lang = (user?.language_preference || 'en') as 'en' | 'hi' | 'gu' | 'or';
  const t = translations[lang];

  const [shops, setShops] = useState<any[]>([]);
  const [villages, setVillages] = useState<string[]>([]);
  const [selectedVillage, setSelectedVillage] = useState<string>(user?.village || '');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [location, setLocation] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = [
    { key: 'kirana', icon: 'storefront', color: '#f59e0b' },
    { key: 'vegetables', icon: 'leaf', color: '#10b981' },
    { key: 'fruits', icon: 'nutrition', color: '#ef4444' },
    { key: 'medicine', icon: 'medkit', color: '#3b82f6' },
    { key: 'dairy', icon: 'wine', color: '#8b5cf6' },
    { key: 'bakery', icon: 'pizza', color: '#f97316' },
  ];

  useEffect(() => {
    requestLocationPermission();
    fetchVillages();
    fetchShops();
  }, []);

  useEffect(() => {
    if (selectedVillage || location) {
      fetchShops();
    }
  }, [selectedVillage, selectedCategory]);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        setLocation(loc.coords);
      }
    } catch (error) {
      console.error('Location permission error:', error);
    }
  };

  const fetchVillages = async () => {
    try {
      const response = await getVillages();
      setVillages(response.data.villages);
    } catch (error) {
      console.error('Fetch villages error:', error);
    }
  };

  const fetchShops = async () => {
    setLoading(true);
    try {
      const params: any = {};
      
      if (selectedVillage) {
        params.village = selectedVillage;
      } else if (location) {
        params.lat = location.latitude;
        params.lng = location.longitude;
      }

      if (selectedCategory) {
        params.category = selectedCategory;
      }

      const response = await getShops(params);
      setShops(response.data.shops);
    } catch (error) {
      console.error('Fetch shops error:', error);
      Alert.alert('Error', 'Failed to load shops');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchShops();
  };

  const filteredShops = shops.filter(shop => 
    shop.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Namaste, {user?.name || 'Guest'}! 🙏</Text>
          <View style={styles.locationContainer}>
            <Ionicons name="location" size={16} color="#10b981" />
            <Text style={styles.location}>{selectedVillage || 'Select Village'}</Text>
          </View>
        </View>
        {cartItems.length > 0 && (
          <TouchableOpacity
            style={styles.cartBadgeContainer}
            onPress={() => router.push('/(tabs)/cart')}
          >
            <Ionicons name="cart" size={24} color="#10b981" />
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{cartItems.length}</Text>
            </View>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#9ca3af" />
          <TextInput
            style={styles.searchInput}
            placeholder={t.search}
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Village Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.selectVillage}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.villageChips}>
              {villages.map((village) => (
                <TouchableOpacity
                  key={village}
                  style={[
                    styles.chip,
                    selectedVillage === village && styles.chipActive,
                  ]}
                  onPress={() => setSelectedVillage(village)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      selectedVillage === village && styles.chipTextActive,
                    ]}
                  >
                    {village}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.shopCategories}</Text>
          <View style={styles.categoriesGrid}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.key}
                style={[
                  styles.categoryCard,
                  selectedCategory === category.key && {
                    backgroundColor: category.color + '20',
                    borderColor: category.color,
                  },
                ]}
                onPress={() =>
                  setSelectedCategory(
                    selectedCategory === category.key ? null : category.key
                  )
                }
              >
                <Ionicons name={category.icon as any} size={32} color={category.color} />
                <Text style={styles.categoryText}>
                  {t[category.key as keyof typeof t] as string}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Shops List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.nearbyShops}</Text>
          {loading ? (
            <ActivityIndicator size="large" color="#10b981" style={{ marginTop: 32 }} />
          ) : filteredShops.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="storefront-outline" size={64} color="#d1d5db" />
              <Text style={styles.emptyText}>No shops found</Text>
              <Text style={styles.emptySubtext}>Try selecting a different village</Text>
            </View>
          ) : (
            filteredShops.map((shop) => (
              <TouchableOpacity
                key={shop.id}
                style={styles.shopCard}
                onPress={() => router.push(`/shop/${shop.id}`)}
              >
                <View style={styles.shopIcon}>
                  <Ionicons name="storefront" size={32} color="#10b981" />
                </View>
                <View style={styles.shopInfo}>
                  <Text style={styles.shopName}>{shop.name}</Text>
                  <Text style={styles.shopCategory}>
                    {t[shop.category as keyof typeof t] as string}
                  </Text>
                  <View style={styles.shopLocation}>
                    <Ionicons name="location" size={14} color="#9ca3af" />
                    <Text style={styles.shopAddress}>{shop.village}</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#d1d5db" />
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  greeting: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  location: {
    fontSize: 14,
    color: '#6b7280',
  },
  cartBadgeContainer: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 16,
    margin: 16,
    minHeight: 48,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  villageChips: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#e5e7eb',
  },
  chipActive: {
    backgroundColor: '#10b981',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  chipTextActive: {
    color: '#ffffff',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
  },
  categoryCard: {
    width: '30%',
    aspectRatio: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    gap: 8,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  shopCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  shopIcon: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#d1fae5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shopInfo: {
    flex: 1,
    marginLeft: 12,
  },
  shopName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  shopCategory: {
    fontSize: 14,
    color: '#10b981',
    marginBottom: 4,
  },
  shopLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  shopAddress: {
    fontSize: 12,
    color: '#9ca3af',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 4,
  },
});