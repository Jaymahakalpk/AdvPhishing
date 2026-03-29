import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../src/store/authStore';
import { useCartStore } from '../src/store/cartStore';
import { createOrder } from '../src/utils/api';
import { translations } from '../src/constants/translations';
import { openUPIApp } from '../src/utils/upiDeepLink';

export default function CheckoutScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const { items, getTotal, clearCart } = useCartStore();
  const lang = (user?.language_preference || 'en') as 'en' | 'hi' | 'gu' | 'or';
  const t = translations[lang];

  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'cod'>('cod');
  const [address, setAddress] = useState(user?.village || '');
  const [loading, setLoading] = useState(false);

  const handlePlaceOrder = async () => {
    if (!address.trim()) {
      Alert.alert('Error', 'Please enter delivery address');
      return;
    }

    if (items.length === 0) {
      Alert.alert('Error', 'Cart is empty');
      return;
    }

    setLoading(true);

    try {
      // Group items by shop
      const shopId = items[0].shop_id;
      
      const orderData = {
        customer_id: user!.id,
        shop_id: shopId,
        items: items.map(item => ({
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.quantity,
          price: item.price,
        })),
        total_amount: getTotal(),
        payment_method: paymentMethod,
        payment_status: paymentMethod === 'cod' ? 'pending' : 'pending',
        delivery_address: address,
        delivery_location: user?.location || { lat: 0, lng: 0 },
        status: 'placed',
      };

      const response = await createOrder(orderData);
      const order = response.data.order;

      // If UPI payment, open UPI app
      if (paymentMethod === 'upi') {
        const upiOpened = await openUPIApp(getTotal(), order.id);
        if (!upiOpened) {
          Alert.alert(
            'UPI App Not Available',
            'No UPI app found. Order placed with Cash on Delivery.',
            [
              {
                text: 'OK',
                onPress: () => {
                  clearCart();
                  router.replace('/(tabs)/orders');
                },
              },
            ]
          );
          return;
        }
      }

      // Clear cart and navigate to orders
      await clearCart();
      Alert.alert(
        'Order Placed!',
        `Your order has been placed successfully. Order ID: #${order.id.slice(-6)}`,
        [
          {
            text: 'View Orders',
            onPress: () => router.replace('/(tabs)/orders'),
          },
        ]
      );
    } catch (error) {
      console.error('Place order error:', error);
      Alert.alert('Error', 'Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t.checkout}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Delivery Address */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Address</Text>
          <TextInput
            style={styles.addressInput}
            placeholder="Enter your complete address"
            placeholderTextColor="#9ca3af"
            value={address}
            onChangeText={setAddress}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Order Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          {items.map((item) => (
            <View key={item.product_id} style={styles.itemRow}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.product_name}</Text>
                <Text style={styles.itemQuantity}>Qty: {item.quantity}</Text>
              </View>
              <Text style={styles.itemPrice}>₹{(item.price * item.quantity).toFixed(2)}</Text>
            </View>
          ))}
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>{t.total}:</Text>
            <Text style={styles.totalAmount}>₹{getTotal().toFixed(2)}</Text>
          </View>
        </View>

        {/* Payment Method */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.paymentMethod}</Text>

          {/* Cash on Delivery */}
          <TouchableOpacity
            style={[
              styles.paymentCard,
              paymentMethod === 'cod' && styles.paymentCardActive,
            ]}
            onPress={() => setPaymentMethod('cod')}
          >
            <View style={styles.paymentIcon}>
              <Ionicons name="cash" size={32} color="#10b981" />
            </View>
            <View style={styles.paymentInfo}>
              <Text style={styles.paymentTitle}>{t.cod}</Text>
              <Text style={styles.paymentSubtitle}>Pay when you receive</Text>
            </View>
            {paymentMethod === 'cod' && (
              <Ionicons name="checkmark-circle" size={24} color="#10b981" />
            )}
          </TouchableOpacity>

          {/* UPI Payment */}
          <TouchableOpacity
            style={[
              styles.paymentCard,
              paymentMethod === 'upi' && styles.paymentCardActive,
            ]}
            onPress={() => setPaymentMethod('upi')}
          >
            <View style={styles.paymentIcon}>
              <Ionicons name="card" size={32} color="#3b82f6" />
            </View>
            <View style={styles.paymentInfo}>
              <Text style={styles.paymentTitle}>{t.upi}</Text>
              <Text style={styles.paymentSubtitle}>PhonePe, GPay, Paytm, BHIM</Text>
            </View>
            {paymentMethod === 'upi' && (
              <Ionicons name="checkmark-circle" size={24} color="#10b981" />
            )}
          </TouchableOpacity>

          {paymentMethod === 'upi' && (
            <View style={styles.upiInfo}>
              <Ionicons name="information-circle" size={20} color="#3b82f6" />
              <Text style={styles.upiInfoText}>
                You will be redirected to your UPI app to complete the payment
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Place Order Button */}
      <View style={styles.footer}>
        <View style={styles.footerInfo}>
          <Text style={styles.footerLabel}>Total Amount:</Text>
          <Text style={styles.footerAmount}>₹{getTotal().toFixed(2)}</Text>
        </View>
        <TouchableOpacity
          style={[styles.placeOrderButton, loading && styles.placeOrderButtonDisabled]}
          onPress={handlePlaceOrder}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <>
              <Text style={styles.placeOrderButtonText}>{t.placeOrder}</Text>
              <Ionicons name="checkmark-circle" size={24} color="#ffffff" />
            </>
          )}
        </TouchableOpacity>
      </View>
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
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    flex: 1,
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#ffffff',
    padding: 16,
    marginTop: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  addressInput: {
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
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
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
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
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  paymentCardActive: {
    borderColor: '#10b981',
    backgroundColor: '#d1fae5',
  },
  paymentIcon: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentInfo: {
    flex: 1,
    marginLeft: 12,
  },
  paymentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  paymentSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  upiInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dbeafe',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  upiInfoText: {
    flex: 1,
    fontSize: 13,
    color: '#1e40af',
  },
  footer: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 12,
  },
  footerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  footerAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  placeOrderButton: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    minHeight: 56,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  placeOrderButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  placeOrderButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
});
