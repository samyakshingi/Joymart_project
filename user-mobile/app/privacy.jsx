import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';

export default function PrivacyPolicy() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>Privacy Policy</Text>
      <Text style={styles.date}>Last Updated: April 2026</Text>
      
      <Text style={styles.text}>
        At JoyMart, we take your privacy seriously. This policy describes how we collect, use, and protect your personal information.
      </Text>

      <Text style={styles.sectionTitle}>1. Information We Collect</Text>
      <Text style={styles.text}>
        • Phone Number: Used for authentication and order updates.{"\n"}
        • Delivery Address: Your society and flat number to deliver orders.{"\n"}
        • Order History: To provide "Buy It Again" features.
      </Text>

      <Text style={styles.sectionTitle}>2. Data Security</Text>
      <Text style={styles.text}>
        We use industry-standard encryption to protect your data. Your payment information is never stored on our servers.
      </Text>

      <Text style={styles.sectionTitle}>3. Contact Us</Text>
      <Text style={styles.text}>
        If you have questions about your privacy, contact us at privacy@joymart.com
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
