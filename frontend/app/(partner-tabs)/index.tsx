import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { useAuthStore } from '../../src/store/authStore';
import { getAvailableOrders, assignOrderToPartner, updatePartnerLocation } from '../../src/utils/partnerApi';
import { translations } from '../../src/constants/translations';
import { format } from 'date-fns';

export default function PartnerDashboard() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const lang = (user?.language_preference || 'en') as 'en' | 'hi' | 'gu' | 'or';
  const t = translations[lang];

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [location, setLocation] = useState<any>(null);

  useEffect(() => {
    requestLocationPermission();
    fetchOrders();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        setLocation(loc.coords);
        
        // Update partner location in backend
        try {
          await updatePartnerLocation(user!.id, {
            lat: loc.coords.latitude,
            lng: loc.coords.longitude,
          });
        } catch (error) {
          console.log('Location update error (non-critical):', error);
        }
      } else {
        console.log('Location permission denied (will work without it)');
      }
    } catch (error) {
      console.log('Location permission error (non-critical):', error);
      // Continue without location - app will still work
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await getAvailableOrders(
        user!.id,
        location?.latitude,
        location?.longitude
      );
      setOrders(response.data.orders);
    } catch (error) {
      console.error('Fetch orders error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const handleAcceptOrder = async (orderId: string) => {
    Alert.alert(
      'Accept Order',
      'Do you want to accept this delivery?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: async () => {
            try {
              await assignOrderToPartner(orderId, user!.id);
              Alert.alert('Success', 'Order accepted! You will earn ₹30 for this delivery.');
              fetchOrders();
            } catch (error) {
              console.error('Accept order error:', error);
              Alert.alert('Error', 'Failed to accept order');
            }
          },
        },
      ]
    );
  };

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return '#3b82f6';
      case 'assigned': return '#f59e0b';
      case 'picked_up': return '#f97316';
      case 'on_the_way': return '#10b981';
      default: return '#6b7280';
    }
  };

  // Separate orders into available and active
  const availableOrders = orders.filter(o => o.status === 'accepted' && !o.delivery_partner_id);
  const activeOrders = orders.filter(o => o.delivery_partner_id === user?.id);

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Delivery Partner</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10b981" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Delivery Partner</Text>
          <Text style={styles.headerSubtitle}>Namaste, {user?.name}! 🚴</Text>
        </View>
        <TouchableOpacity onPress={fetchOrders}>
          <Ionicons name="refresh" size={24} color="#10b981" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Active Deliveries */}
        {activeOrders.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Active Deliveries</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{activeOrders.length}</Text>
              </View>
            </View>
            {activeOrders.map((order) => (
              <TouchableOpacity
                key={order.id}
                style={styles.activeOrderCard}
                onPress={() => router.push(`/partner/order/${order.id}`)}
              >
                <View style={styles.orderHeader}>
                  <View>
                    <Text style={styles.orderId}>Order #{order.id.slice(-6)}</Text>
                    <Text style={styles.orderTime}>
                      {format(new Date(order.created_at), 'hh:mm a')}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getOrderStatusColor(order.status) },
                    ]}
                  >
                    <Text style={styles.statusText}>
                      {order.status.replace('_', ' ').toUpperCase()}
                    </Text>
                  </View>
                </View>
                <View style={styles.orderDetails}>
                  <View style={styles.orderInfo}>
                    <Ionicons name="location" size={16} color="#6b7280" />
                    <Text style={styles.orderAddress} numberOfLines={1}>
                      {order.delivery_address}
                    </Text>
                  </View>
                  <View style={styles.orderInfo}>
                    <Ionicons name="cube" size={16} color="#6b7280" />
                    <Text style={styles.orderItems}>{order.items.length} items</Text>
                  </View>
                </View>
                <View style={styles.orderFooter}>
                  <Text style={styles.orderAmount}>₹{order.total_amount.toFixed(2)}</Text>
                  <Text style={styles.earning}>Earn: ₹30</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Available Orders */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Available Orders</Text>
            {availableOrders.length > 0 && (
              <View style={[styles.badge, { backgroundColor: '#3b82f6' }]}>
                <Text style={styles.badgeText}>{availableOrders.length}</Text>
              </View>
            )}
          </View>
          {availableOrders.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="bicycle-outline" size={80} color="#d1d5db" />
              <Text style={styles.emptyText}>No orders available</Text>
              <Text style={styles.emptySubtext}>New orders will appear here</Text>
            </View>
          ) : (
            availableOrders.map((order) => (
              <View key={order.id} style={styles.orderCard}>
                <View style={styles.orderHeader}>
                  <View>
                    <Text style={styles.orderId}>Order #{order.id.slice(-6)}</Text>
                    {order.shop_details && (
                      <Text style={styles.shopName}>{order.shop_details.name}</Text>
                    )}
                  </View>
                  <View style={styles.newBadge}>
                    <Text style={styles.newBadgeText}>NEW</Text>
                  </View>
                </View>
                <View style={styles.orderDetails}>
                  <View style={styles.orderInfo}>
                    <Ionicons name="location" size={16} color="#6b7280" />
                    <Text style={styles.orderAddress} numberOfLines={2}>
                      {order.delivery_address}
                    </Text>
                  </View>
                  <View style={styles.orderInfo}>
                    <Ionicons name="cube" size={16} color="#6b7280" />
                    <Text style={styles.orderItems}>{order.items.length} items</Text>
                  </View>
                  <View style={styles.orderInfo}>
                    <Ionicons name="card" size={16} color="#6b7280" />
                    <Text style={styles.paymentMethod}>
                      {order.payment_method === 'cod' ? 'Cash on Delivery' : 'UPI'}
                    </Text>
                  </View>
                </View>
                <View style={styles.orderFooter}>
                  <View>
                    <Text style={styles.orderAmount}>₹{order.total_amount.toFixed(2)}</Text>
                    <Text style={styles.earning}>You earn: ₹30</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.acceptButton}
                    onPress={() => handleAcceptOrder(order.id)}
                  >
                    <Ionicons name="checkmark-circle" size={20} color="#ffffff" />
                    <Text style={styles.acceptButtonText}>Accept</Text>
                  </TouchableOpacity>
                </View>
              </View>
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
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  badge: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  activeOrderCard: {
    backgroundColor: '#d1fae5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#10b981',
  },
  orderCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  orderTime: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  shopName: {
    fontSize: 13,
    color: '#10b981',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  newBadge: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  newBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  orderDetails: {
    gap: 8,
    marginBottom: 12,
  },
  orderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  orderAddress: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
  },
  orderItems: {
    fontSize: 14,
    color: '#6b7280',
  },
  paymentMethod: {
    fontSize: 14,
    color: '#6b7280',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  orderAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  earning: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
    marginTop: 2,
  },
  acceptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10b981',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  acceptButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
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