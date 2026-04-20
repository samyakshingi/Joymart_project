import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useStore } from '../store';
import { useRouter } from 'expo-router';

export default function Login() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('phone'); // 'phone' or 'otp'
  const [isLoading, setIsLoading] = useState(false);
  const { setUser } = useStore();
  const router = useRouter();

  const handleSendOTP = async () => {
    if (phone.length !== 10) {
      Alert.alert("Error", "Please enter a valid 10-digit mobile number.");
      return;
    }
    setIsLoading(true);
    // Simulation of OTP Sending (In a real app, you'd use Firebase Auth here)
    // Note: To implement real Firebase OTP in Expo without native modules, 
    // we would need a Recaptcha solution.
    setTimeout(() => {
      setIsLoading(false);
      setStep('otp');
      Alert.alert("Demo Mode", "OTP sent! Use '123456' to login.");
    }, 1500);
  };

  const handleVerifyOTP = async () => {
    if (otp === '123456') {
      setIsLoading(true);
      // In real flow, verify with Firebase and get token
      setTimeout(() => {
        setUser({ phone: phone });
        setIsLoading(false);
        router.replace('/');
      }, 1000);
    } else {
      Alert.alert("Error", "Invalid OTP. Please try again.");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>JoyMart Login</Text>
        <Text style={styles.subtitle}>Enter your details to continue</Text>

        {step === 'phone' ? (
          <View>
            <View style={styles.inputContainer}>
              <Text style={styles.prefix}>+91</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                maxLength={10}
                placeholder="Mobile Number"
                value={phone}
                onChangeText={setPhone}
                autoFocus
              />
            </View>
            <TouchableOpacity style={styles.btn} onPress={handleSendOTP} disabled={isLoading}>
              {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Send OTP</Text>}
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            <TextInput
              style={[styles.input, styles.otpInput]}
              keyboardType="numeric"
              maxLength={6}
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChangeText={setOtp}
              autoFocus
            />
            <TouchableOpacity style={styles.btn} onPress={handleVerifyOTP} disabled={isLoading}>
              {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Verify & Login</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setStep('phone')} style={styles.resend}>
              <Text style={styles.resendText}>Change Number</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', justifyContent: 'center', padding: 24 },
  card: { backgroundColor: '#fff', borderRadius: 32, padding: 32, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20 },
  title: { fontSize: 28, fontWeight: '900', color: '#0f172a', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#64748b', fontWeight: 'bold', textAlign: 'center', marginBottom: 32 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 16, borderWIdth: 2, borderColor: '#f1f5f9', paddingHorizontal: 16, marginBottom: 24 },
  prefix: { fontSize: 18, fontWeight: '900', color: '#94a3b8', marginRight: 8 },
  input: { flex: 1, height: 56, fontSize: 18, fontWeight: '900', color: '#0f172a' },
  otpInput: { textAlign: 'center', backgroundColor: '#f8fafc', borderRadius: 16, borderWidth: 2, borderColor: '#f1f5f9', marginBottom: 24, letterSpacing: 4 },
  btn: { backgroundColor: '#10b981', height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', shadowColor: '#10b981', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  btnText: { color: '#fff', fontSize: 18, fontWeight: '900' },
  resend: { marginTop: 24, alignItems: 'center' },
  resendText: { color: '#64748b', fontWeight: 'bold', textDecorationLine: 'underline' }
});
