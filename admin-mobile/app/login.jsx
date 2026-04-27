import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../api';
import { THEME } from '../constants/theme';

export default function Login() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('phone'); // phone, otp, role
  const [isLoading, setIsLoading] = useState(false);
  const [userProfile, setUserProfile] = useState(null);

  const handleSendOTP = () => {
    if (phone.length !== 10) {
      Alert.alert('Error', 'Please enter a valid 10-digit phone number');
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setStep('otp');
      Alert.alert("Demo OTP", "Use 123456");
    }, 1000);
  };

  const handleVerifyOTP = async () => {
    if (otp !== '123456') return Alert.alert("Error", "Invalid OTP");
    
    setIsLoading(true);
    try {
      const res = await api.get(`/users/${phone}`);
      setUserProfile(res.data);
      setStep('role');
    } catch (err) {
      Alert.alert("Error", "User not found or unauthorized.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleSelection = async (role) => {
    await AsyncStorage.setItem('joymart_admin_phone', phone);
    await AsyncStorage.setItem('joymart_admin_role', role);
    
    // Redirect based on role
    if (role === 'Rider') {
      router.replace('/deliveries');
    } else {
      router.replace('/');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Staff Login</Text>
        <Text style={styles.subtitle}>JoyMart Operations Portal</Text>
        
        {step === 'phone' ? (
          <View style={styles.form}>
            <View style={styles.inputWrapper}>
              <Text style={styles.prefix}>+91</Text>
              <TextInput 
                style={styles.input}
                keyboardType="phone-pad"
                maxLength={10}
                value={phone}
                onChangeText={setPhone}
                placeholder="Mobile Number"
              />
            </View>
            <TouchableOpacity 
              style={[styles.button, isLoading && styles.buttonDisabled]} 
              onPress={handleSendOTP}
              disabled={isLoading}
            >
              {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Send OTP</Text>}
            </TouchableOpacity>
          </View>
        ) : step === 'otp' ? (
          <View style={styles.form}>
            <TextInput 
              style={[styles.input, styles.otpInput]}
              keyboardType="number-pad"
              maxLength={6}
              value={otp}
              onChangeText={setOtp}
              placeholder="000000"
            />
            <TouchableOpacity 
              style={[styles.button, isLoading && styles.buttonDisabled]} 
              onPress={handleVerifyOTP}
              disabled={isLoading}
            >
              {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Verify & Login</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setStep('phone')}>
              <Text style={styles.changeText}>Change Number</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.form}>
            <Text style={styles.welcomeText}>Welcome back, {userProfile?.name}!</Text>
            <Text style={styles.selectText}>SELECT YOUR ROLE</Text>
            
            <TouchableOpacity 
              style={styles.roleAdminBtn} 
              onPress={() => handleRoleSelection('Admin')}
            >
              <Text style={styles.roleAdminText}>Login as Admin</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.roleRiderBtn} 
              onPress={() => handleRoleSelection('Rider')}
            >
              <Text style={styles.roleRiderText}>Login as Rider</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 30,
    padding: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 30,
  },
  form: {
    gap: 20,
  },
  inputWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  prefix: {
    position: 'absolute',
    left: 20,
    fontSize: 18,
    fontWeight: '900',
    color: '#94a3b8',
    zIndex: 1,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 2,
    borderColor: '#f1f5f9',
    borderRadius: 16,
    paddingVertical: 16,
    paddingRight: 20,
    paddingLeft: 60,
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: 2,
  },
  otpInput: {
    paddingLeft: 20,
    textAlign: 'center',
    letterSpacing: 10,
  },
  button: {
    backgroundColor: '#0f172a',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
  },
  changeText: {
    color: '#94a3b8',
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 10,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#10b981',
    textAlign: 'center',
    marginBottom: 10,
  },
  selectText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#64748b',
    textAlign: 'center',
    letterSpacing: 2,
    marginBottom: 10,
  },
  roleAdminBtn: {
    backgroundColor: '#0f172a',
    paddingVertical: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  roleAdminText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
  },
  roleRiderBtn: {
    backgroundColor: '#f8fafc',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    paddingVertical: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  roleRiderText: {
    color: '#475569',
    fontSize: 18,
    fontWeight: '900',
  }
});
