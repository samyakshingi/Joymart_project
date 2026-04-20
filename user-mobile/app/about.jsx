import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';

export default function About() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>About JoyMart</Text>
      <Text style={styles.text}>
        JoyMart is your neighborhood's fastest grocery delivery service. We believe in bringing the freshest products 
        from local stores directly to your doorstep in minutes.
      </Text>
      <Text style={styles.sectionTitle}>Our Mission</Text>
      <Text style={styles.text}>
        To empower local societies and store owners by providing a seamless, lightning-fast delivery experience 
        to residents.
      </Text>
      <View style={styles.footer}>
        <Text style={styles.footerText}>Version 1.2.0</Text>
        <Text style={styles.footerText}>© 2026 JoyMart Technologies</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  contentContainer: { padding: 24 },
  title: { fontSize: 32, fontWeight: '900', color: '#0f172a', marginBottom: 24 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#1e293b', marginTop: 32, marginBottom: 12 },
  text: { fontSize: 16, lineHeight: 24, color: '#475569', fontWeight: '500' },
  footer: { marginTop: 60, alignItems: 'center', borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 24 },
  footerText: { fontSize: 12, color: '#94a3b8', fontWeight: 'bold', marginBottom: 4 }
});
