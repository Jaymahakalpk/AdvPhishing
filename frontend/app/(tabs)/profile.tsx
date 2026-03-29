import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { useCartStore } from '../../src/store/cartStore';
import { updateUser } from '../../src/utils/api';
import { translations, Language } from '../../src/constants/translations';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, setUser, logout } = useAuthStore();
  const clearCart = useCartStore((state) => state.clearCart);
  const lang = (user?.language_preference || 'en') as Language;
  const t = translations[lang];

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [village, setVillage] = useState(user?.village || '');
  const [selectedLang, setSelectedLang] = useState<Language>(lang);

  const handleSave = async () => {
    try {
      await updateUser(user!.id, {
        name,
        village,
        language_preference: selectedLang,
      });

      const updatedUser = {
        ...user!,
        name,
        village,
        language_preference: selectedLang,
      };

      await setUser(updatedUser);
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      console.error('Update profile error:', error);
      Alert.alert('Error', 'Failed to update profile');
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
            await clearCart();
            router.replace('/');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t.profile}</Text>
        {!isEditing ? (
          <TouchableOpacity onPress={() => setIsEditing(true)}>
            <Ionicons name="create-outline" size={24} color="#10b981" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={handleSave}>
            <Ionicons name="checkmark" size={28} color="#10b981" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Info */}
        <View style={styles.profileSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(user?.name || 'U').charAt(0).toUpperCase()}
            </Text>
          </View>

          <View style={styles.infoContainer}>
            <Text style={styles.label}>Name</Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Enter your name"
                placeholderTextColor="#9ca3af"
              />
            ) : (
              <Text style={styles.value}>{user?.name || 'Not set'}</Text>
            )}
          </View>

          <View style={styles.infoContainer}>
            <Text style={styles.label}>Phone Number</Text>
            <Text style={styles.value}>{user?.phone}</Text>
          </View>

          <View style={styles.infoContainer}>
            <Text style={styles.label}>Village/City</Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={village}
                onChangeText={setVillage}
                placeholder="Enter your village"
                placeholderTextColor="#9ca3af"
              />
            ) : (
              <Text style={styles.value}>{user?.village || 'Not set'}</Text>
            )}
          </View>
        </View>

        {/* Language Preference */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.language}</Text>
          <View style={styles.languageGrid}>
            {(['en', 'hi', 'gu', 'or'] as Language[]).map((l) => (
              <TouchableOpacity
                key={l}
                style={[
                  styles.languageCard,
                  selectedLang === l && styles.languageCardActive,
                  !isEditing && styles.languageCardDisabled,
                ]}
                onPress={() => isEditing && setSelectedLang(l)}
                disabled={!isEditing}
              >
                <Text
                  style={[
                    styles.languageText,
                    selectedLang === l && styles.languageTextActive,
                  ]}
                >
                  {l === 'en' ? 'English' : l === 'hi' ? 'हिंदी' : l === 'gu' ? 'ગુજરાતી' : 'ଓଡ଼ିଆ'}
                </Text>
                {selectedLang === l && (
                  <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* App Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="information-circle" size={20} color="#10b981" />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoTitle}>Gaon Delivery</Text>
                <Text style={styles.infoSubtitle}>Hyperlocal Delivery for Rural India</Text>
              </View>
            </View>
          </View>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="globe" size={20} color="#10b981" />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoTitle}>Version</Text>
                <Text style={styles.infoSubtitle}>1.0.0</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#ef4444" />
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
    marginBottom: 24,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  infoContainer: {
    width: '100%',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 6,
  },
  value: {
    fontSize: 16,
    color: '#111827',
  },
  input: {
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 12,
    paddingVertical: 10,
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
  languageGrid: {
    gap: 12,
  },
  languageCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  languageCardActive: {
    borderColor: '#10b981',
    backgroundColor: '#d1fae5',
  },
  languageCardDisabled: {
    opacity: 0.6,
  },
  languageText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  languageTextActive: {
    color: '#059669',
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