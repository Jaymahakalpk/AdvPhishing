import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../src/store/authStore';
import { sendOTP, verifyOTP, updateUser } from '../src/utils/api';
import { translations, Language } from '../src/constants/translations';

export default function LoginScreen() {
  const router = useRouter();
  const { isAuthenticated, setUser, user } = useAuthStore();
  const [phone, setPhone] = useState('');
  const [otp, setOTP] = useState('');
  const [step, setStep] = useState<'phone' | 'otp' | 'profile'>('phone');
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState<Language>('en');
  const [name, setName] = useState('');
  const [village, setVillage] = useState('');
  const [role, setRole] = useState<'customer' | 'delivery_partner'>('customer');
  const [generatedOTP, setGeneratedOTP] = useState('');

  const t = translations[language];

  useEffect(() => {
    if (isAuthenticated && user?.name) {
      // Route based on user role
      if (user?.role === 'delivery_partner') {
        router.replace('/(partner-tabs)');
      } else {
        router.replace('/(tabs)');
      }
    }
  }, [isAuthenticated, user]);

  const handleSendOTP = async () => {
    if (phone.length !== 10) {
      Alert.alert('Error', 'Please enter a valid 10-digit phone number');
      return;
    }

    setLoading(true);
    try {
      const response = await sendOTP(phone);
      console.log('OTP Response:', response.data);
      const otpCode = response.data.otp;
      setGeneratedOTP(otpCode);
      Alert.alert('OTP Sent Successfully!', `Your OTP is: ${otpCode}\n\nPlease enter this code in the next screen.`);
      setStep('otp');
    } catch (error) {
      console.error('Send OTP error:', error);
      Alert.alert('Error', 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 4) {
      Alert.alert('Error', 'Please enter a valid 4-digit OTP');
      return;
    }

    setLoading(true);
    try {
      const response = await verifyOTP(phone, otp);
      const userData = response.data.user;
      
      // Clear any cached data first
      await AsyncStorage.clear();
      
      // Set fresh user data
      await setUser(userData);
      
      if (!userData.name) {
        setStep('profile');
      } else {
        // Route based on role immediately
        if (userData.role === 'delivery_partner') {
          router.replace('/(partner-tabs)');
        } else {
          router.replace('/(tabs)');
        }
      }
    } catch (error) {
      console.error('Verify OTP error:', error);
      Alert.alert('Error', 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteProfile = async () => {
    if (!name || !village) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    setLoading(true);
    try {
      // Update only name, village, and language - keep existing role
      await updateUser(user!.id, {
        name,
        village,
        language_preference: language,
      });
      
      // Keep the user's existing role from backend
      const updatedUser = { 
        ...user!, 
        name, 
        village, 
        language_preference: language 
      };
      await setUser(updatedUser);
      
      // Route based on user's role
      if (user!.role === 'delivery_partner') {
        router.replace('/(partner-tabs)');
      } else {
        router.replace('/(tabs)');
      }
    } catch (error) {
      console.error('Update profile error:', error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Language Selector */}
          <View style={styles.languageContainer}>
            <Text style={styles.languageLabel}>{t.language}:</Text>
            <View style={styles.languageButtons}>
              {(['en', 'hi', 'gu', 'or'] as Language[]).map((lang) => (
                <TouchableOpacity
                  key={lang}
                  style={[styles.langButton, language === lang && styles.langButtonActive]}
                  onPress={() => setLanguage(lang)}
                >
                  <Text style={[styles.langText, language === lang && styles.langTextActive]}>
                    {lang === 'or' ? 'OD' : lang.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Logo/Title */}
          <View style={styles.header}>
            <Ionicons name="bicycle" size={80} color="#10b981" />
            <Text style={styles.title}>{t.welcome}</Text>
            <Text style={styles.subtitle}>{t.loginTitle}</Text>
          </View>

          {/* Phone Input */}
          {step === 'phone' && (
            <View style={styles.formContainer}>
              <Text style={styles.label}>{t.phoneNumber}</Text>
              <View style={styles.phoneInput}>
                <Text style={styles.phonePrefix}>+91</Text>
                <TextInput
                  style={styles.input}
                  placeholder="9876543210"
                  placeholderTextColor="#9ca3af"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  maxLength={10}
                  autoFocus
                />
              </View>
              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleSendOTP}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>{t.sendOTP}</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* OTP Input */}
          {step === 'otp' && (
            <View style={styles.formContainer}>
              <Text style={styles.label}>{t.enterOTP}</Text>
              {generatedOTP && (
                <View style={styles.otpDisplay}>
                  <Text style={styles.otpDisplayLabel}>Your OTP Code:</Text>
                  <Text style={styles.otpDisplayCode}>{generatedOTP}</Text>
                </View>
              )}
              <TextInput
                style={[styles.input, styles.otpInput]}
                placeholder="1234"
                placeholderTextColor="#9ca3af"
                value={otp}
                onChangeText={setOTP}
                keyboardType="number-pad"
                maxLength={4}
                autoFocus
              />
              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleVerifyOTP}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>{t.verify}</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setStep('phone')} style={styles.backButton}>
                <Text style={styles.backButtonText}>← Back</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Profile Setup */}
          {step === 'profile' && (
            <View style={styles.formContainer}>
              <Text style={styles.label}>Your Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your name"
                placeholderTextColor="#9ca3af"
                value={name}
                onChangeText={setName}
                autoFocus
              />
              <Text style={styles.label}>Village/City</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your village or city"
                placeholderTextColor="#9ca3af"
                value={village}
                onChangeText={setVillage}
              />
              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleCompleteProfile}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Continue</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  languageContainer: {
    marginBottom: 32,
    alignItems: 'center',
  },
  languageLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  languageButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  langButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#e5e7eb',
  },
  langButtonActive: {
    backgroundColor: '#10b981',
  },
  langText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  langTextActive: {
    color: '#ffffff',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
  },
  formContainer: {
    gap: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  phoneInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    paddingHorizontal: 16,
    minHeight: 56,
  },
  phonePrefix: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 18,
    color: '#111827',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    paddingHorizontal: 16,
    minHeight: 56,
  },
  otpInput: {
    textAlign: 'center',
    fontSize: 32,
    letterSpacing: 12,
    fontWeight: 'bold',
  },
  otpDisplay: {
    backgroundColor: '#d1fae5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#10b981',
    alignItems: 'center',
  },
  otpDisplayLabel: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '600',
    marginBottom: 8,
  },
  otpDisplayCode: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#10b981',
    letterSpacing: 8,
  },
  button: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    minHeight: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: '#9ca3af',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  backButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  backButtonText: {
    fontSize: 16,
    color: '#10b981',
    fontWeight: '600',
  },
});