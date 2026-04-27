import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Platform, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '../api';
import { useStore } from '../store';
import { useTranslation } from 'react-i18next';

export default function Checkout() {
  const router = useRouter();
  const { cart, addToCart, decreaseQuantity, clearCart, user, setUser } = useStore();
  
  const cartTotal = cart.reduce((sum, item) => {
    const price = item.product.discounted_price || item.product.price;
    return sum + (price * item.quantity);
  }, 0);
  
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [tipAmount, setTipAmount] = useState(0);
  const [deliveryInstructions, setDeliveryInstructions] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash'); // Cash or UPI
  const [deliverySlot, setDeliverySlot] = useState('Immediate (As soon as possible)');

  const { t } = useTranslation();

  const discountAmount = appliedCoupon ? (cartTotal * appliedCoupon.discount_percentage / 100) : 0;
  const deliveryFee = cartTotal >= 100 ? 0 : 30;
  const finalTotal = (cartTotal - discountAmount) + deliveryFee + tipAmount;

  const [societies, setSocieties] = useState([]);
  const [formData, setFormData] = useState({
    phone: user.phone || '',
    name: user.name || '',
    society_id: user.society_id || '',
    flat_number: user.flat_number || ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isStoreOpen, setIsStoreOpen] = useState(true);
  const [showSocietyModal, setShowSocietyModal] = useState(false);

  useEffect(() => {
    const fetchSocieties = async () => {
      try {
        const res = await api.get(`/societies`);
        setSocieties(res.data);
      } catch (err) { console.error(err); }
    };
    fetchSocieties();

    const fetchStatus = async () => {
      try {
        const res = await api.get(`/store/status`);
        setIsStoreOpen(res.data.is_open);
      } catch (err) {}
    };
    fetchStatus();
  }, []);

  const handlePhoneChange = async (value) => {
    setFormData({ ...formData, phone: value });
    if (value.length === 10) {
      try {
        const res = await api.get(`/users/${value}`);
        if (res.data) {
          setFormData(prev => ({
            ...prev,
            phone: value,
            name: res.data.name || prev.name,
            society_id: res.data.society_id?.toString() || prev.society_id,
            flat_number: res.data.flat_number || prev.flat_number
          }));
        }
      } catch (err) {}
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    try {
      const phone = formData.phone || user.phone || '';
      const res = await api.get(`/coupons/${couponCode.toUpperCase()}?phone=${phone}`);
      if (res.data.is_active) {
        setAppliedCoupon(res.data);
        Alert.alert("Success", `${res.data.discount_percentage}% discount applied!`);
      } else {
        Alert.alert("Error", "This coupon is no longer active.");
      }
    } catch (err) {
      const msg = err.response?.data?.detail || "Invalid coupon code.";
      Alert.alert("Error", msg);
    }
  };

  const handleSubmit = async () => {
    if (cart.length === 0) return Alert.alert("Error", "Cart is empty");
    if (!formData.phone || !formData.name || !formData.society_id || !formData.flat_number) {
      return Alert.alert("Error", "Please fill all details");
    }
    
    setIsSubmitting(true);
    try {
      const userRes = await api.post(`/users`, {
        phone: formData.phone,
        name: formData.name,
        society_id: parseInt(formData.society_id),
        flat_number: formData.flat_number
      });
      const userId = userRes.data.id;

      setUser({
        phone: formData.phone,
        name: formData.name,
        society_id: formData.society_id,
        flat_number: formData.flat_number
      });

      const items = cart.map(item => ({ product_id: item.product.id, quantity: item.quantity }));
      await api.post(`/orders`, { 
        user_id: userId, 
        items,
        tip_amount: tipAmount,
        delivery_instructions: deliveryInstructions,
        applied_coupon: appliedCoupon ? appliedCoupon.code : null,
        payment_method: paymentMethod,
        delivery_slot: deliverySlot
      });
      
      clearCart();
      router.push('/tracking');
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to place order.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveList = () => {
    Alert.prompt(
      "Save Cart as Smart List",
      "Enter a name for this list (e.g., 'Monthly Ration'):",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Save",
          onPress: async (listName) => {
            if (!listName) return;
            try {
              const userRes = await api.get(`/users/${user.phone}`);
              await api.post(`/users/${userRes.data.id}/saved-lists`, {
                list_name: listName,
                items: cart.map(item => ({
                  product_id: item.product.id,
                  quantity: item.quantity
                }))
              });
              Alert.alert('Success', 'Cart saved as Smart List successfully!');
            } catch (err) {
              console.error(err);
              Alert.alert('Error', 'Failed to save list.');
            }
          }
        }
      ]
    );
  };

  if (cart.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>Your cart is feeling light</Text>
        <Text style={styles.emptySubtitle}>Add some fresh groceries to get started.</Text>
        <TouchableOpacity style={styles.browseButton} onPress={() => router.push('/')}>
          <Text style={styles.browseButtonText}>Browse Catalog</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.stepCircle}><Text style={styles.stepNumber}>1</Text></View>
          <Text style={styles.cardTitle}>Delivery Details</Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>10-Digit Mobile Number</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            maxLength={10}
            value={formData.phone}
            onChangeText={handlePhoneChange}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            value={formData.name}
            onChangeText={(v) => setFormData({...formData, name: v})}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Society</Text>
          <TouchableOpacity 
            style={styles.pickerContainer}
            onPress={() => setShowSocietyModal(true)}
          >
            <Text style={[styles.pickerText, !formData.society_id && { color: '#94a3b8' }]}>
              {formData.society_id 
                ? societies.find(s => s.id.toString() === formData.society_id)?.name || 'Select Society'
                : 'Select Society'}
            </Text>
          </TouchableOpacity>
        </View>

        <Modal visible={showSocietyModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Society</Text>
                <TouchableOpacity onPress={() => setShowSocietyModal(false)}>
                  <Text style={styles.modalCloseText}>Close</Text>
                </TouchableOpacity>
              </View>
              <ScrollView>
                {societies.map(s => (
                  <TouchableOpacity 
                    key={s.id} 
                    style={[styles.modalItem, formData.society_id === s.id.toString() && styles.modalItemActive]}
                    onPress={() => {
                      setFormData({...formData, society_id: s.id.toString()});
                      setShowSocietyModal(false);
                    }}
                  >
                    <Text style={[styles.modalItemText, formData.society_id === s.id.toString() && styles.modalItemTextActive]}>
                      {s.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Flat Number</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. A-101"
            value={formData.flat_number}
            onChangeText={(v) => setFormData({...formData, flat_number: v})}
          />
        </View>
      </View>

      {/* Coupons & Tipping */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Offers & Tipping</Text>
        
        {/* Coupon Section */}
        <View style={styles.couponSection}>
          <Text style={styles.label}>Apply Coupon</Text>
          <View style={styles.couponRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Enter Code"
              autoCapitalize="characters"
              value={couponCode}
              onChangeText={setCouponCode}
              editable={!appliedCoupon}
            />
            {appliedCoupon ? (
              <TouchableOpacity onPress={() => { setAppliedCoupon(null); setCouponCode(''); }} style={styles.appliedBadge}>
                <Text style={styles.appliedBadgeText}>REMOVE</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={handleApplyCoupon} style={styles.applyBtn}>
                <Text style={styles.applyBtnText}>APPLY</Text>
              </TouchableOpacity>
            )}
          </View>
          {appliedCoupon && (
            <Text style={styles.couponSuccess}>✓ Coupon {appliedCoupon.code} applied!</Text>
          )}
        </View>

        {/* Tipping Section */}
        <View style={styles.tipSection}>
          <Text style={styles.label}>Add a Tip for the Rider</Text>
          <View style={styles.tipOptions}>
            {[10, 20, 50, 100].map(amt => (
              <TouchableOpacity 
                key={amt} 
                onPress={() => setTipAmount(tipAmount === amt ? 0 : amt)}
                style={[styles.tipBtn, tipAmount === amt && styles.tipBtnActive]}
              >
                <Text style={[styles.tipBtnText, tipAmount === amt && styles.tipBtnTextActive]}>₹{amt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Delivery Instructions</Text>
        <TextInput
          style={styles.instructionInput}
          placeholder="e.g. Leave at the gate, ring the bell, etc."
          multiline
          numberOfLines={3}
          value={deliveryInstructions}
          onChangeText={setDeliveryInstructions}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Payment Method</Text>
        <View style={styles.paymentOptions}>
          {['Cash', 'UPI'].map(method => (
            <TouchableOpacity 
              key={method}
              onPress={() => setPaymentMethod(method)}
              style={[styles.paymentBtn, paymentMethod === method && styles.paymentBtnActive]}
            >
              <View style={[styles.radio, paymentMethod === method && styles.radioActive]}>
                {paymentMethod === method && <View style={styles.radioInner} />}
              </View>
              <Text style={[styles.paymentBtnText, paymentMethod === method && styles.paymentBtnTextActive]}>{method}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.paymentHint}>Pay via {paymentMethod} on delivery</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Order Summary</Text>
        <View style={styles.cartList}>
          {cart.map(item => (
            <View key={item.product.id} style={styles.cartItem}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cartItemName} numberOfLines={1}>{item.product.name}</Text>
                <Text style={styles.cartItemPrice}>₹{item.product.price}</Text>
              </View>
              <View style={styles.qtyContainer}>
                <TouchableOpacity onPress={() => decreaseQuantity(item.product.id)} style={styles.qtyBtn}>
                  <Text style={styles.qtyBtnText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.qtyText}>{item.quantity}</Text>
                <TouchableOpacity onPress={() => addToCart(item.product)} style={styles.qtyBtn}>
                  <Text style={styles.qtyBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.summaryBox}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Item Total</Text>
            <Text style={styles.summaryValue}>₹{cartTotal.toFixed(2)}</Text>
          </View>
          {appliedCoupon && (
            <View style={styles.summaryRow}>
              <Text style={styles.discountLabel}>Coupon Discount ({appliedCoupon.discount_percentage}%)</Text>
              <Text style={styles.discountValue}>-₹{discountAmount.toFixed(2)}</Text>
            </View>
          )}
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery Partner Fee</Text>
            {deliveryFee === 0 ? (
              <Text style={styles.freeText}>FREE</Text>
            ) : (
              <Text style={styles.summaryValue}>₹{deliveryFee.toFixed(2)}</Text>
            )}
          </View>
          {tipAmount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Rider Tip</Text>
              <Text style={styles.summaryValue}>₹{tipAmount.toFixed(2)}</Text>
            </View>
          )}
          {deliveryFee > 0 && !appliedCoupon && (
            <View style={styles.deliveryPromo}>
              <Text style={styles.deliveryPromoText}>Add ₹{(100 - cartTotal).toFixed(2)} more for FREE Delivery!</Text>
            </View>
          )}
          </View>
          <View style={[styles.summaryRow, styles.grandTotalRow]}>
            <Text style={styles.grandTotalLabel}>{t('Total') || 'Grand Total'}</Text>
            <Text style={styles.grandTotalValue}>₹{finalTotal.toFixed(2)}</Text>
          </View>
        </View>

        <View style={styles.slotContainer}>
          <Text style={styles.slotHeader}>{t('Delivery Time') || 'Delivery Time'}</Text>
          {[
            'Immediate (As soon as possible)',
            'Today Evening (06:00 PM - 08:00 PM)',
            'Tomorrow Morning (07:00 AM - 09:00 AM)'
          ].map((slot) => (
            <TouchableOpacity 
              key={slot} 
              style={[styles.slotItem, deliverySlot === slot && styles.slotItemActive]}
              onPress={() => setDeliverySlot(slot)}
            >
              <View style={[styles.radio, deliverySlot === slot && styles.radioActive]}>
                {deliverySlot === slot && <View style={styles.radioInner} />}
              </View>
              <Text style={[styles.slotItemText, deliverySlot === slot && styles.slotItemTextActive]}>
                {t(slot) || slot}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.paymentInfo}>
          <Text style={styles.paymentInfoText}>Pay via Cash or UPI when your order arrives at the door.</Text>
        </View>

        <TouchableOpacity 
          style={[styles.submitButton, (isSubmitting || !isStoreOpen) && styles.submitButtonDisabled]}
          disabled={isSubmitting || !isStoreOpen}
          onPress={handleSubmit}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : !isStoreOpen ? (
            <Text style={styles.submitButtonText}>Store is Closed</Text>
          ) : (
            <View style={styles.submitButtonInner}>
              <Text style={styles.submitButtonText}>{t('Place Order') || 'Place Order'}</Text>
              <Text style={styles.submitButtonText}>₹{finalTotal.toFixed(2)}</Text>
            </View>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.saveListBtn}
          onPress={handleSaveList}
        >
          <Text style={styles.saveListBtnText}>📝 Save Cart as Smart List</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  contentContainer: { padding: 16, paddingBottom: 40 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  emptyTitle: { fontSize: 24, fontWeight: '900', color: '#0f172a', marginBottom: 8, textAlign: 'center' },
  emptySubtitle: { fontSize: 16, color: '#64748b', marginBottom: 24, textAlign: 'center' },
  browseButton: { backgroundColor: '#0f172a', paddingVertical: 16, paddingHorizontal: 32, borderRadius: 16 },
  browseButtonText: { color: '#fff', fontWeight: '900', fontSize: 16 },
  card: { backgroundColor: '#fff', borderRadius: 24, padding: 20, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  stepCircle: { width: 40, height: 40, backgroundColor: '#f1f5f9', borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  stepNumber: { fontSize: 18, fontWeight: '900', color: '#0f172a' },
  cardTitle: { fontSize: 24, fontWeight: '900', color: '#0f172a' },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 10, fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginLeft: 8 },
  input: { borderBottomWidth: 2, borderBottomColor: '#e2e8f0', fontSize: 18, fontWeight: 'bold', color: '#0f172a', paddingVertical: 8, paddingHorizontal: 8 },
  pickerContainer: { backgroundColor: '#f8fafc', borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', padding: 16 },
  pickerText: { fontSize: 16, fontWeight: 'bold', color: '#0f172a' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '50%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: '#0f172a' },
  modalCloseText: { fontSize: 16, fontWeight: 'bold', color: '#64748b' },
  modalItem: { paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  modalItemActive: { backgroundColor: '#ecfdf5', borderRadius: 12, paddingHorizontal: 12 },
  modalItemText: { fontSize: 16, fontWeight: 'bold', color: '#334155' },
  modalItemTextActive: { color: '#059669' },
  cartList: { maxHeight: 300, marginBottom: 24 },
  cartItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', padding: 12, borderRadius: 16, marginBottom: 8, borderWidth: 1, borderColor: '#f1f5f9' },
  cartItemName: { fontSize: 14, fontWeight: 'bold', color: '#0f172a', marginBottom: 4 },
  cartItemPrice: { fontSize: 14, fontWeight: 'bold', color: '#64748b' },
  qtyContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 20, padding: 4, borderWidth: 1, borderColor: '#e2e8f0' },
  qtyBtn: { width: 28, height: 28, justifyContent: 'center', alignItems: 'center' },
  qtyBtnText: { color: '#475569', fontSize: 18, fontWeight: 'bold' },
  qtyText: { width: 24, textAlign: 'center', fontWeight: '900', color: '#0f172a' },
  summaryBox: { backgroundColor: '#f8fafc', borderRadius: 16, padding: 16, marginBottom: 24 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  summaryLabel: { fontSize: 14, fontWeight: 'bold', color: '#64748b' },
  summaryValue: { fontSize: 14, fontWeight: 'bold', color: '#0f172a' },
  freeText: { fontSize: 14, fontWeight: '900', color: '#10b981' },
  deliveryPromo: { backgroundColor: '#ecfdf5', padding: 8, borderRadius: 8, marginTop: 4, marginBottom: 12 },
  deliveryPromoText: { color: '#065f46', fontSize: 12, fontWeight: 'bold', textAlign: 'center' },
  grandTotalRow: { borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 16, marginTop: 4, marginBottom: 0 },
  grandTotalLabel: { fontSize: 16, fontWeight: '900', color: '#0f172a' },
  grandTotalValue: { fontSize: 24, fontWeight: '900', color: '#10b981' },
  paymentInfo: { backgroundColor: '#0f172a', padding: 16, borderRadius: 16, marginBottom: 20 },
  paymentInfoText: { color: '#fff', fontSize: 14, fontWeight: '500', textAlign: 'center' },
  submitButton: { backgroundColor: '#10b981', padding: 20, borderRadius: 16 },
  submitButtonDisabled: { backgroundColor: '#cbd5e1' },
  submitButtonInner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  submitButtonText: { color: '#fff', fontSize: 18, fontWeight: '900' },
  saveListBtn: { backgroundColor: '#ecfdf5', padding: 16, borderRadius: 16, marginTop: 12, borderWidth: 2, borderColor: '#a7f3d0', alignItems: 'center' },
  saveListBtnText: { color: '#059669', fontSize: 16, fontWeight: '900' },
  couponSection: { marginBottom: 24 },
  couponRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  applyBtn: { backgroundColor: '#0f172a', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12 },
  applyBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  appliedBadge: { backgroundColor: '#fef2f2', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: '#fecaca' },
  appliedBadgeText: { color: '#ef4444', fontWeight: 'black', fontSize: 10 },
  couponSuccess: { color: '#059669', fontSize: 12, fontWeight: 'bold', marginTop: 8, marginLeft: 8 },
  tipSection: { marginBottom: 8 },
  tipOptions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  tipBtn: { flex: 1, backgroundColor: '#f8fafc', paddingVertical: 12, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  tipBtnActive: { backgroundColor: '#0f172a', borderColor: '#0f172a' },
  tipBtnText: { fontWeight: 'bold', color: '#475569' },
  tipBtnTextActive: { color: '#fff' },
  instructionInput: { backgroundColor: '#f8fafc', borderRadius: 16, padding: 16, fontSize: 14, fontWeight: '500', color: '#0f172a', borderWidth: 1, borderColor: '#e2e8f0', minHeight: 80, textAlignVertical: 'top' },
  discountLabel: { fontSize: 14, fontWeight: 'bold', color: '#059669' },
  discountValue: { fontSize: 14, fontWeight: 'bold', color: '#059669' },
  paymentOptions: { flexDirection: 'row', gap: 12, marginTop: 12 },
  paymentBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', gap: 12 },
  paymentBtnActive: { backgroundColor: '#10b981', borderColor: '#10b981' },
  paymentBtnText: { fontSize: 16, fontWeight: '900', color: '#475569' },
  paymentBtnTextActive: { color: '#fff' },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#cbd5e1', justifyContent: 'center', alignItems: 'center' },
  radioActive: { borderColor: '#fff' },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#fff' },
  paymentHint: { fontSize: 10, fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', marginTop: 12, marginLeft: 4 },
  slotContainer: { backgroundColor: '#fff', borderRadius: 24, padding: 20, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  slotHeader: { fontSize: 16, fontWeight: '900', color: '#0f172a', marginBottom: 12 },
  slotItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, borderWidth: 2, borderColor: '#f1f5f9', marginBottom: 8 },
  slotItemActive: { borderColor: '#10b981', backgroundColor: '#ecfdf5' },
  slotItemText: { fontSize: 14, fontWeight: 'bold', color: '#64748b', flex: 1, marginLeft: 12 },
  slotItemTextActive: { color: '#065f46' }
});
