import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal, TextInput, ActivityIndicator, Alert } from 'react-native';
import { api } from '../api';

export default function Accounts() {
  const [suppliers, setSuppliers] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('Invoice');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchSuppliers = async () => {
    try {
      const res = await api.get('/suppliers');
      setSuppliers(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchTransactions = async (supplierId) => {
    try {
      const res = await api.get(`/suppliers/${supplierId}/transactions`);
      setTransactions(res.data.sort((a, b) => b.id - a.id));
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleTransaction = async () => {
    if (!amount || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await api.post(`/suppliers/${selectedSupplier.id}/transactions`, {
        amount: parseFloat(amount),
        transaction_type: modalType,
        description
      });
      setAmount('');
      setDescription('');
      setShowModal(false);
      fetchSuppliers();
      fetchTransactions(selectedSupplier.id);
    } catch (err) {
      Alert.alert("Error", "Transaction failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Digital Khata</Text>
        <Text style={styles.subtitle}>Supplier Ledgers</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.supplierScroll}>
        {suppliers.map(s => (
          <TouchableOpacity 
            key={s.id}
            onPress={() => {
              setSelectedSupplier(s);
              fetchTransactions(s.id);
            }}
            style={[styles.supplierCard, selectedSupplier?.id === s.id && styles.supplierCardActive]}
          >
            <Text style={[styles.supplierName, selectedSupplier?.id === s.id && styles.supplierNameActive]}>{s.name}</Text>
            <Text style={[styles.supplierBalance, s.outstanding_balance > 0 ? styles.textRed : styles.textGreen]}>₹{s.outstanding_balance}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {selectedSupplier ? (
        <View style={styles.ledgerContainer}>
          <View style={styles.ledgerHeader}>
            <View>
              <Text style={styles.ledgerTitle}>{selectedSupplier.name}</Text>
              <Text style={styles.ledgerSubtitle}>Outstanding: ₹{selectedSupplier.outstanding_balance}</Text>
            </View>
            <View style={styles.actionRow}>
              <TouchableOpacity onPress={() => { setModalType('Invoice'); setShowModal(true); }} style={styles.btnBill}>
                <Text style={styles.btnText}>Add Bill</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setModalType('Payment'); setShowModal(true); }} style={styles.btnPay}>
                <Text style={styles.btnText}>Pay</Text>
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={styles.transactionList}>
            {transactions.map(t => (
              <View key={t.id} style={styles.transactionItem}>
                <View>
                  <Text style={styles.tDesc}>{t.description || (t.transaction_type === 'Invoice' ? 'Stock' : 'Payment')}</Text>
                  <Text style={styles.tDate}>{new Date(t.date).toLocaleDateString()}</Text>
                </View>
                <Text style={[styles.tAmount, t.transaction_type === 'Invoice' ? styles.textRed : styles.textGreen]}>
                  {t.transaction_type === 'Invoice' ? '+' : '-'} ₹{t.amount}
                </Text>
              </View>
            ))}
            {transactions.length === 0 && <Text style={styles.emptyText}>No history found.</Text>}
          </ScrollView>
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>Select a supplier to view history</Text>
        </View>
      )}

      <Modal visible={showModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{modalType === 'Invoice' ? 'Add Supplier Bill' : 'Record Payment'}</Text>
            <TextInput
              style={styles.input}
              placeholder="Amount (₹)"
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
            />
            <TextInput
              style={styles.input}
              placeholder="Description (optional)"
              value={description}
              onChangeText={setDescription}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setShowModal(false)} style={styles.btnCancel}>
                <Text style={styles.btnCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleTransaction} style={[styles.btnSave, modalType === 'Invoice' ? { backgroundColor: '#ef4444' } : { backgroundColor: '#10b981' }]}>
                {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnSaveText}>Save</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: '900', color: '#0f172a' },
  subtitle: { fontSize: 14, fontWeight: 'bold', color: '#64748b' },
  supplierScroll: { paddingHorizontal: 16, paddingVertical: 12, maxHeight: 120, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  supplierCard: { backgroundColor: '#fff', padding: 16, borderRadius: 16, marginRight: 12, borderWidth: 1, borderColor: '#e2e8f0', minWidth: 120, alignItems: 'center', height: 80 },
  supplierCardActive: { backgroundColor: '#0f172a', borderColor: '#0f172a' },
  supplierName: { fontSize: 14, fontWeight: '900', color: '#334155', marginBottom: 4 },
  supplierNameActive: { color: '#fff' },
  supplierBalance: { fontSize: 16, fontWeight: '900' },
  ledgerContainer: { flex: 1, padding: 16 },
  ledgerHeader: { backgroundColor: '#fff', padding: 20, borderRadius: 24, marginBottom: 16, borderBottomWidth: 4, borderBottomColor: '#0f172a' },
  ledgerTitle: { fontSize: 20, fontWeight: '900', color: '#0f172a' },
  ledgerSubtitle: { fontSize: 14, fontWeight: 'bold', color: '#64748b', marginTop: 4 },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 16 },
  btnBill: { flex: 1, backgroundColor: '#ef4444', paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  btnPay: { flex: 1, backgroundColor: '#10b981', paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold' },
  transactionList: { flex: 1 },
  transactionItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 16, marginBottom: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  tDesc: { fontSize: 14, fontWeight: 'bold', color: '#0f172a' },
  tDate: { fontSize: 10, color: '#94a3b8', marginTop: 4 },
  tAmount: { fontSize: 16, fontWeight: '900' },
  textRed: { color: '#ef4444' },
  textGreen: { color: '#10b981' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyStateText: { color: '#94a3b8', fontWeight: 'bold' },
  emptyText: { textAlign: 'center', color: '#94a3b8', marginTop: 40, fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 24, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: '#0f172a', marginBottom: 20 },
  input: { borderBottomWidth: 2, borderBottomColor: '#e2e8f0', fontSize: 16, paddingVertical: 12, marginBottom: 16, fontWeight: 'bold' },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 12 },
  btnCancel: { flex: 1, backgroundColor: '#f1f5f9', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  btnCancelText: { color: '#64748b', fontWeight: 'bold' },
  btnSave: { flex: 1, paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  btnSaveText: { color: '#fff', fontWeight: 'bold' }
});
