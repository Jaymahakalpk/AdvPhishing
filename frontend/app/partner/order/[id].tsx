import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { getOrder, updateOrderStatus } from '../../src/utils/api';
import { format } from 'date-fns';

export default function OrderDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    setLoading(true);
    try {
      const response = await getOrder(id as string);
      setOrder(response.data.order);
    } catch (error) {
      console.error('Fetch order error:', error);
      Alert.alert('Error', 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    const statusLabels: any = {
      'on_the_way': 'On the Way',
      'delivered': 'Delivered'
    };

    Alert.alert(
      `Update Status to ${statusLabels[newStatus]}?`,
      'Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Update',
          onPress: async () => {
            setUpdating(true);
            try {
              await updateOrderStatus(id as string, newStatus);
              Alert.alert('Success', 'Order status updated!');
              fetchOrder();
            } catch (error) {
              console.error('Update status error:', error);
              Alert.alert('Error', 'Failed to update status');
            } finally {
              setUpdating(false);
            }
          }
        }
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'picked_up': return '#f97316';
      case 'on_the_way': return '#10b981';
      case 'delivered': return '#059669';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Order Details</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10b981" />
        </View>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Order Details</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Order not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const canUpdateToOnTheWay = order.status === 'picked_up';
  const canUpdateToDelivered = order.status === 'on_the_way';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Order Header */}
        <View style={styles.orderHeader}>
          <View>
            <Text style={styles.orderId}>Order #{order.id.slice(-6)}</Text>
            <Text style={styles.orderDate}>
              {format(new Date(order.created_at), 'dd MMM yyyy, hh:mm a')}
            </Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(order.status) }
            ]}
          >
            <Text style={styles.statusText}>
              {order.status.replace('_', ' ').toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Delivery Address */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="location" size={24} color="#10b981" />
            <Text style={styles.sectionTitle}>Delivery Address</Text>
          </View>
          <Text style={styles.address}>{order.delivery_address}</Text>
        </View>

        {/* Items List */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="cube" size={24} color="#10b981" />
            <Text style={styles.sectionTitle}>Items ({order.items.length})</Text>
          </View>
          {order.items.map((item: any, index: number) => (
            <View key={index} style={styles.itemCard}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.product_name}</Text>
                <Text style={styles.itemQuantity}>Qty: {item.quantity}</Text>
              </View>
              <Text style={styles.itemPrice}>₹{(item.price * item.quantity).toFixed(2)}</Text>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Amount:</Text>
            <Text style={styles.totalAmount}>₹{order.total_amount.toFixed(2)}</Text>
          </View>
        </View>

        {/* Payment Info */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="card" size={24} color="#10b981" />
            <Text style={styles.sectionTitle}>Payment</Text>
          </View>
          <View style={styles.paymentCard}>
            <Ionicons
              name={order.payment_method === 'cod' ? 'cash' : 'card'}
              size={20}
              color="#6b7280"
            />
            <Text style={styles.paymentText}>
              {order.payment_method === 'cod' ? 'Cash on Delivery' : 'UPI Payment'}
            </Text>
            <View
              style={[
                styles.paymentStatusBadge,
                order.payment_status === 'completed'
                  ? styles.paymentCompleted
                  : styles.paymentPending
              ]}
            >
              <Text style={styles.paymentStatusText}>
                {order.payment_status === 'completed' ? 'Paid' : 'Pending'}
              </Text>
            </View>
          </View>
        </View>

        {/* Earning Info */}
        <View style={styles.earningCard}>
          <View style={styles.earningIcon}>
            <Ionicons name="wallet" size={32} color="#10b981" />
          </View>
          <View>
            <Text style={styles.earningLabel}>Your Earning</Text>
            <Text style={styles.earningAmount}>₹30.00</Text>
          </View>
        </View>

        {/* Action Buttons */}
        {canUpdateToOnTheWay && (
          <TouchableOpacity
            style={[styles.actionButton, updating && styles.actionButtonDisabled]}
            onPress={() => handleStatusUpdate('on_the_way')}
            disabled={updating}
          >
            {updating ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <Ionicons name="bicycle" size={24} color="#ffffff" />
                <Text style={styles.actionButtonText}>Start Delivery (On the Way)</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {canUpdateToDelivered && (
          <TouchableOpacity
            style={[styles.actionButton, styles.deliveredButton, updating && styles.actionButtonDisabled]}
            onPress={() => handleStatusUpdate('delivered')}
            disabled={updating}
          >
            {updating ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={24} color="#ffffff" />
                <Text style={styles.actionButtonText}>Mark as Delivered</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {order.status === 'delivered' && (
          <View style={styles.completedCard}>
            <Ionicons name="checkmark-circle" size={48} color="#059669" />
            <Text style={styles.completedText}>Delivery Completed!</Text>
            <Text style={styles.completedSubtext}>Great job! ₹30 added to your earnings.</Text>
          </View>
        )}

        <View style={{ height: 32 }} />
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
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    flex: 1,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    color: '#6b7280',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  orderId: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  orderDate: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  section: {
    backgroundColor: '#ffffff',
    padding: 16,
    marginTop: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  address: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
  },
  itemCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  itemQuantity: {
    fontSize: 14,
    color: '#6b7280',
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10b981',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    marginTop: 8,
    borderTopWidth: 2,
    borderTopColor: '#e5e7eb',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  paymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  paymentText: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
  },
  paymentStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  paymentCompleted: {
    backgroundColor: '#d1fae5',
  },
  paymentPending: {
    backgroundColor: '#fef3c7',
  },
  paymentStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
  },
  earningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d1fae5',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 20,
    borderRadius: 12,
    gap: 16,
  },
  earningIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  earningLabel: {
    fontSize: 14,
    color: '#059669',
    marginBottom: 4,
  },
  earningAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#059669',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  deliveredButton: {
    backgroundColor: '#059669',
  },
  actionButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  actionButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  completedCard: {
    alignItems: 'center',
    backgroundColor: '#d1fae5',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 32,
    borderRadius: 12,
  },
  completedText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#059669',
    marginTop: 16,
  },
  completedSubtext: {
    fontSize: 16,
    color: '#059669',
    marginTop: 8,
    textAlign: 'center',
  },
});
