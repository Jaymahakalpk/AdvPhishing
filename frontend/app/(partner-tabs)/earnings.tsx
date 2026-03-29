import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/authStore';
import { getPartnerEarnings, requestPayout } from '../../src/utils/partnerApi';
import { format } from 'date-fns';

export default function EarningsScreen() {
  const user = useAuthStore((state) => state.user);
  
  const [earnings, setEarnings] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState<'today' | 'week' | 'all'>('all');
  const [payoutAmount, setPayoutAmount] = useState('');

  useEffect(() => {
    fetchEarnings();
  }, [period]);

  const fetchEarnings = async () => {
    setLoading(true);
    try {
      const response = await getPartnerEarnings(user!.id, period);
      setEarnings(response.data);
      setTransactions(response.data.transactions);
    } catch (error) {
      console.error('Fetch earnings error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchEarnings();
  };

  const handleRequestPayout = async () => {
    const amount = parseFloat(payoutAmount);
    
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount');
      return;
    }

    if (amount > earnings?.total_earnings) {
      Alert.alert('Insufficient Balance', `You only have ₹${earnings?.total_earnings.toFixed(2)} available`);
      return;
    }

    Alert.alert(
      'Request Payout',
      `Request payout of ₹${amount.toFixed(2)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Request',
          onPress: async () => {
            try {
              await requestPayout(user!.id, amount);
              Alert.alert('Success', 'Payout request submitted successfully!');
              setPayoutAmount('');
              fetchEarnings();
            } catch (error) {
              console.error('Payout request error:', error);
              Alert.alert('Error', 'Failed to request payout');
            }
          },
        },
      ]
    );
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Earnings</Text>
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
        <Text style={styles.headerTitle}>Earnings</Text>
        <TouchableOpacity onPress={fetchEarnings}>
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
        {/* Total Earnings Card */}
        <View style={styles.earningsCard}>
          <View style={styles.earningsIcon}>
            <Ionicons name="wallet" size={40} color="#10b981" />
          </View>
          <Text style={styles.earningsLabel}>Total Balance</Text>
          <Text style={styles.earningsAmount}>
            ₹{earnings?.total_earnings?.toFixed(2) || '0.00'}
          </Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Deliveries</Text>
              <Text style={styles.statValue}>{earnings?.total_deliveries || 0}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Per Delivery</Text>
              <Text style={styles.statValue}>₹30</Text>
            </View>
          </View>
        </View>

        {/* Period Selector */}
        <View style={styles.periodSelector}>
          {(['today', 'week', 'all'] as const).map((p) => (
            <TouchableOpacity
              key={p}
              style={[
                styles.periodButton,
                period === p && styles.periodButtonActive,
              ]}
              onPress={() => setPeriod(p)}
            >
              <Text
                style={[
                  styles.periodButtonText,
                  period === p && styles.periodButtonTextActive,
                ]}
              >
                {p === 'today' ? 'Today' : p === 'week' ? 'This Week' : 'All Time'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Period Earnings */}
        <View style={styles.periodEarningsCard}>
          <Text style={styles.periodEarningsLabel}>
            {period === 'today' ? "Today's Earnings" : period === 'week' ? 'This Week' : 'Total Earnings'}
          </Text>
          <Text style={styles.periodEarningsAmount}>
            ₹{earnings?.period_earnings?.toFixed(2) || '0.00'}
          </Text>
        </View>

        {/* Payout Request */}
        <View style={styles.payoutCard}>
          <Text style={styles.payoutTitle}>Request Payout</Text>
          <View style={styles.payoutInputContainer}>
            <Text style={styles.rupeeSymbol}>₹</Text>
            <TextInput
              style={styles.payoutInput}
              placeholder="Enter amount"
              placeholderTextColor="#9ca3af"
              value={payoutAmount}
              onChangeText={setPayoutAmount}
              keyboardType="decimal-pad"
            />
          </View>
          <TouchableOpacity
            style={[
              styles.payoutButton,
              (!payoutAmount || parseFloat(payoutAmount) <= 0) && styles.payoutButtonDisabled,
            ]}
            onPress={handleRequestPayout}
            disabled={!payoutAmount || parseFloat(payoutAmount) <= 0}
          >
            <Ionicons name="cash" size={20} color="#ffffff" />
            <Text style={styles.payoutButtonText}>Request Payout</Text>
          </TouchableOpacity>
          <Text style={styles.payoutNote}>
            Minimum payout: ₹100 • Processed within 2-3 business days
          </Text>
        </View>

        {/* Transaction History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Transaction History</Text>
          {transactions.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={64} color="#d1d5db" />
              <Text style={styles.emptyText}>No transactions yet</Text>
            </View>
          ) : (
            transactions.map((transaction) => (
              <View key={transaction.id} style={styles.transactionCard}>
                <View style={styles.transactionIcon}>
                  <Ionicons
                    name={transaction.type === 'earning' ? 'arrow-down' : 'arrow-up'}
                    size={20}
                    color={transaction.type === 'earning' ? '#10b981' : '#ef4444'}
                  />
                </View>
                <View style={styles.transactionInfo}>
                  <Text style={styles.transactionType}>
                    {transaction.type === 'earning' ? 'Delivery Earning' : 'Payout'}
                  </Text>
                  <Text style={styles.transactionDate}>
                    {format(new Date(transaction.created_at), 'dd MMM yyyy, hh:mm a')}
                  </Text>
                  {transaction.order_id && (
                    <Text style={styles.transactionOrderId}>
                      Order #{transaction.order_id.slice(-6)}
                    </Text>
                  )}
                </View>
                <Text
                  style={[
                    styles.transactionAmount,
                    transaction.type === 'earning' ? styles.earningAmount : styles.payoutAmountText,
                  ]}
                >
                  {transaction.type === 'earning' ? '+' : '-'}₹{transaction.amount.toFixed(2)}
                </Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  earningsCard: {
    backgroundColor: '#10b981',
    margin: 16,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  earningsIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  earningsLabel: {
    fontSize: 16,
    color: '#d1fae5',
    marginBottom: 8,
  },
  earningsAmount: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#d1fae5',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  periodSelector: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  periodButtonActive: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  periodButtonTextActive: {
    color: '#ffffff',
  },
  periodEarningsCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  periodEarningsLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  periodEarningsAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#111827',
  },
  payoutCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  payoutTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  payoutInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  rupeeSymbol: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginRight: 4,
  },
  payoutInput: {
    flex: 1,
    fontSize: 18,
    color: '#111827',
    paddingVertical: 12,
  },
  payoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    borderRadius: 8,
    paddingVertical: 14,
    gap: 8,
    marginBottom: 12,
  },
  payoutButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  payoutButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  payoutNote: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  transactionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  transactionDate: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  transactionOrderId: {
    fontSize: 12,
    color: '#10b981',
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  earningAmount: {
    color: '#10b981',
  },
  payoutAmountText: {
    color: '#ef4444',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 16,
  },
});