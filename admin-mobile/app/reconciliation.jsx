import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { api } from '../api';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export default function Reconciliation() {
  const [report, setReport] = useState(null);
  const [actualCash, setActualCash] = useState('');
  const [actualUPI, setActualUPI] = useState('');

  const fetchReport = async () => {
    try {
      const res = await api.get('/reports/reconciliation');
      setReport(res.data);
    } catch (err) { console.error(err); }
  };

  const handleExport = async () => {
    try {
      const response = await api.get('/reports/export', { responseType: 'blob' });
      // On mobile, we convert to base64 or use file system to share
      // For simplicity in expo-sharing with a blob:
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result.split(',')[1];
        const filename = `${FileSystem.documentDirectory}joymart_export.csv`;
        await FileSystem.writeAsStringAsync(filename, base64, { encoding: FileSystem.EncodingType.Base64 });
        await Sharing.shareAsync(filename);
      };
      reader.readAsDataURL(response.data);
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to export data.");
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const cashDelta = report ? (parseFloat(actualCash || 0) - report.expected_cash) : 0;
  const upiDelta = report ? (parseFloat(actualUPI || 0) - report.expected_upi) : 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={styles.title}>Daily Audit</Text>
            <Text style={styles.subtitle}>Close Register for Today</Text>
          </View>
          <TouchableOpacity onPress={handleExport} style={styles.exportBtn}>
            <Text style={{ fontSize: 18 }}>📊</Text>
            <Text style={styles.exportBtnText}>CSV</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.auditCard}>
        <Text style={styles.cardTitle}>💵 Cash Audit</Text>
        <View style={styles.expectedBox}>
          <Text style={styles.expectedLabel}>System Expected</Text>
          <Text style={styles.expectedValue}>₹{report?.expected_cash.toFixed(2) || '0.00'}</Text>
        </View>
        <TextInput
          style={styles.input}
          placeholder="Enter Actual Cash"
          keyboardType="numeric"
          value={actualCash}
          onChangeText={setActualCash}
        />
        <View style={[styles.deltaBox, cashDelta < 0 ? styles.bgRed : cashDelta > 0 ? styles.bgGreen : styles.bgSlate]}>
          <Text style={styles.deltaLabel}>Difference</Text>
          <Text style={styles.deltaValue}>₹{cashDelta.toFixed(2)}</Text>
        </View>
      </View>

      <View style={styles.auditCard}>
        <Text style={styles.cardTitle}>📱 UPI Audit</Text>
        <View style={styles.expectedBox}>
          <Text style={styles.expectedLabel}>System Expected</Text>
          <Text style={styles.expectedValue}>₹{report?.expected_upi.toFixed(2) || '0.00'}</Text>
        </View>
        <TextInput
          style={styles.input}
          placeholder="Enter Actual UPI"
          keyboardType="numeric"
          value={actualUPI}
          onChangeText={setActualUPI}
        />
        <View style={[styles.deltaBox, upiDelta < 0 ? styles.bgRed : upiDelta > 0 ? styles.bgGreen : styles.bgSlate]}>
          <Text style={styles.deltaLabel}>Difference</Text>
          <Text style={styles.deltaValue}>₹{upiDelta.toFixed(2)}</Text>
        </View>
      </View>

      <TouchableOpacity 
        style={styles.closeBtn}
        onPress={() => Alert.alert("Success", "Register Closed Successfully!", [{ text: "OK", onPress: () => fetchReport() }])}
      >
        <Text style={styles.closeBtnText}>Confirm & Close Register</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 20 },
  header: { marginBottom: 24 },
  title: { fontSize: 32, fontWeight: '900', color: '#0f172a' },
  subtitle: { fontSize: 16, fontWeight: 'bold', color: '#64748b' },
  auditCard: { backgroundColor: '#fff', borderRadius: 24, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: '#e2e8f0' },
  cardTitle: { fontSize: 20, fontWeight: '900', color: '#0f172a', marginBottom: 20 },
  expectedBox: { backgroundColor: '#f8fafc', padding: 16, borderRadius: 16, marginBottom: 16 },
  expectedLabel: { fontSize: 10, fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4 },
  expectedValue: { fontSize: 24, fontWeight: '900', color: '#0f172a' },
  input: { borderBottomWidth: 2, borderBottomColor: '#e2e8f0', fontSize: 20, paddingVertical: 12, marginBottom: 16, fontWeight: 'bold', color: '#0f172a' },
  deltaBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 16 },
  bgSlate: { backgroundColor: '#f1f5f9' },
  bgRed: { backgroundColor: '#fef2f2' },
  bgGreen: { backgroundColor: '#ecfdf5' },
  deltaLabel: { fontSize: 12, fontWeight: '900', color: '#64748b', textTransform: 'uppercase' },
  deltaValue: { fontSize: 18, fontWeight: '900', color: '#0f172a' },
  closeBtn: { backgroundColor: '#0f172a', paddingVertical: 20, borderRadius: 20, alignItems: 'center', marginTop: 10 },
  closeBtnText: { color: '#fff', fontSize: 18, fontWeight: '900' },
  exportBtn: { backgroundColor: '#f1f5f9', padding: 12, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  exportBtnText: { fontSize: 10, fontWeight: '900', color: '#64748b', marginTop: 2 }
});
