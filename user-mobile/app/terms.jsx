import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';

export default function Terms() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>Terms & Conditions</Text>
      <Text style={styles.date}>Last Updated: April 2026</Text>
      
      <Text style={styles.text}>
        By using JoyMart, you agree to the following terms and conditions.
      </Text>

      <Text style={styles.sectionTitle}>1. Order Acceptance</Text>
      <Text style={styles.text}>
        We reserve the right to cancel orders due to stock unavailability or store closure. Prices are subject to change without notice.
      </Text>

      <Text style={styles.sectionTitle}>2. Delivery</Text>
      <Text style={styles.text}>
        Delivery times are estimates. We aim for under 20 minutes but external factors like weather may impact timing.
      </Text>

      <Text style={styles.sectionTitle}>3. Payment</Text>
      <Text style={styles.text}>
        Currently, we support Cash on Delivery (CoD) and UPI at the time of delivery.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  contentContainer: { padding: 24 },
  title: { fontSize: 28, fontWeight: '900', color: '#0f172a', marginBottom: 8 },
  date: { fontSize: 14, color: '#94a3b8', fontWeight: 'bold', marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b', marginTop: 24, marginBottom: 8 },
  text: { fontSize: 15, lineHeight: 22, color: '#475569', fontWeight: '500' }
});
