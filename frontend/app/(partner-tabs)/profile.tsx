import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Switch, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { getDeliveryPartner, updateDeliveryPartner } from '../../src/utils/partnerApi';
import { translations, Language } from '../../src/constants/translations';

export default function PartnerProfileScreen() {
  const router = useRouter();
  const { user, setUser, logout } = useAuthStore();
  const lang = (user?.language_preference || 'en') as Language;
  const t = translations[lang];

  const [partner, setPartner] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAvailable, setIsAvailable] = useState(true);

  useEffect(() => {
    fetchPartnerData();
  }, []);

  const fetchPartnerData = async () => {
    try {
      const response = await getDeliveryPartner(user!.id);
      setPartner(response.data.partner);
      setIsAvailable(response.data.partner.is_available);
    } catch (error) {
      console.error('Fetch partner error:', error);
      // Partner might not exist yet, that's okay
    } finally {
      setLoading(false);
    }
  };

  const toggleAvailability = async (value: boolean) => {
    try {
      await updateDeliveryPartner(user!.id, { is_available: value });
      setIsAvailable(value);
      Alert.alert(
        value ? 'You are Online' : 'You are Offline',
        value ? 'You will receive new orders' : 'You will not receive new orders'
      );
    } catch (error) {
      console.error('Toggle availability error:', error);
      Alert.alert('Error', 'Failed to update availability');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      t.logout,
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: t.logout,
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/');
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t.profile}</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size=\"large\" color=\"#10b981\" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t.profile}</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Info */}
        <View style={styles.profileSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(user?.name || 'D').charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.name}>{user?.name || 'Delivery Partner'}</Text>
          <Text style={styles.phone}>{user?.phone}</Text>
          {partner?.is_verified && (
            <View style={styles.verifiedBadge}>
              <Ionicons name=\"checkmark-circle\" size={16} color=\"#10b981\" />
              <Text style={styles.verifiedText}>Verified Partner</Text>
            </View>
          )}
        </View>

        {/* Availability Toggle */}
        <View style={styles.section}>
          <View style={styles.availabilityCard}>
            <View style={styles.availabilityInfo}>
              <View style={styles.availabilityHeader}>
                <Ionicons
                  name={isAvailable ? 'checkmark-circle' : 'close-circle'}
                  size={32}
                  color={isAvailable ? '#10b981' : '#ef4444'}
                />
                <View style={styles.availabilityTextContainer}>
                  <Text style={styles.availabilityTitle}>
                    {isAvailable ? 'You are Online' : 'You are Offline'}
                  </Text>
                  <Text style={styles.availabilitySubtitle}>
                    {isAvailable ? 'Receiving new orders' : 'Not receiving orders'}
                  </Text>
                </View>
              </View>
            </View>
            <Switch
              value={isAvailable}
              onValueChange={toggleAvailability}
              trackColor={{ false: '#d1d5db', true: '#10b981' }}
              thumbColor=\"#ffffff\"
            />
          </View>
        </View>

        {/* Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Statistics</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Ionicons name=\"bicycle\" size={32} color=\"#10b981\" />
              <Text style={styles.statValue}>{partner?.total_deliveries || 0}</Text>
              <Text style={styles.statLabel}>Deliveries</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name=\"wallet\" size={32} color=\"#f59e0b\" />
              <Text style={styles.statValue}>₹{partner?.total_earnings?.toFixed(0) || 0}</Text>
              <Text style={styles.statLabel}>Total Earned</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name=\"star\" size={32} color=\"#fbbf24\" />
              <Text style={styles.statValue}>{partner?.rating?.toFixed(1) || '5.0'}</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
          </View>
        </View>

        {/* Account Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name=\"call\" size={20} color=\"#6b7280\" />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Phone Number</Text>
                <Text style={styles.infoValue}>{user?.phone}</Text>
              </View>
            </View>
          </View>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name=\"location\" size={20} color=\"#6b7280\" />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Village/City</Text>
                <Text style={styles.infoValue}>{user?.village || 'Not set'}</Text>
              </View>
            </View>
          </View>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name=\"language\" size={20} color=\"#6b7280\" />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Language</Text>
                <Text style={styles.infoValue}>
                  {lang === 'en' ? 'English' : lang === 'hi' ? 'हिंदी' : lang === 'gu' ? 'ગુજરાતી' : 'ଓଡ଼ିଆ'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* App Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name=\"bicycle\" size={20} color=\"#10b981\" />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoTitle}>Gaon Delivery Partner</Text>
                <Text style={styles.infoSubtitle}>Earn ₹30 per delivery</Text>
              </View>
            </View>
          </View>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name=\"information-circle\" size={20} color=\"#10b981\" />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoTitle}>Version</Text>
                <Text style={styles.infoSubtitle}>1.0.0</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name=\"log-out-outline\" size={24} color=\"#ef4444\" />
          <Text style={styles.logoutText}>{t.logout}</Text>
        </TouchableOpacity>

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
  profileSection: {
    backgroundColor: '#ffffff',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    alignItems: 'center',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  phone: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 12,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d1fae5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  verifiedText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  availabilityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  availabilityInfo: {
    flex: 1,
  },
  availabilityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  availabilityTextContainer: {
    flex: 1,
  },
  availabilityTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  availabilitySubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  infoSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    borderWidth: 2,
    borderColor: '#ef4444',
    gap: 8,
  },
  logoutText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ef4444',
  },
});
