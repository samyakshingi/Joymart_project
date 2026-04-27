import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, RefreshControl, Modal, TextInput, Image } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import { api } from '../api';

export default function RiderDashboard() {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // OTP State
  const [otpModalVisible, setOtpModalVisible] = useState(false);
  const [enteredOtp, setEnteredOtp] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Camera State
  const [cameraVisible, setCameraVisible] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraRef, setCameraRef] = useState(null);
  const [photoUrlMap, setPhotoUrlMap] = useState({});

  const fetchDeliveries = async () => {
    try {
      const res = await api.get('/orders');
      const activeDeliveries = res.data.filter(o => o.status === 'OutForDelivery');
      setDeliveries(activeDeliveries);
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to load deliveries");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDeliveries();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDeliveries();
  };

  const markDelivered = (order) => {
    if (order.payment_method === 'Cash') {
      setSelectedOrder(order);
      setOtpModalVisible(true);
    } else {
      submitStatus(order.id, 'Completed', null, photoUrlMap[order.id]);
    }
  };

  const submitOTP = async () => {
    if (!enteredOtp || enteredOtp.length !== 4) {
      Alert.alert('Error', 'Please enter a 4-digit PIN');
      return;
    }
    submitStatus(selectedOrder.id, 'Completed', enteredOtp, photoUrlMap[selectedOrder.id]);
  };

  const submitStatus = async (orderId, status, otp, photoUrl) => {
    try {
      await api.put(`/orders/${orderId}/status`, { status, submitted_otp: otp, delivery_photo_url: photoUrl });
      setDeliveries(prev => prev.filter(o => o.id !== orderId));
      setOtpModalVisible(false);
      setEnteredOtp('');
      Alert.alert("Success", "Order marked as delivered!");
    } catch (err) {
      console.error(err);
      if (err.response?.status === 400 && err.response?.data?.detail === "Invalid OTP") {
        Alert.alert('Incorrect PIN', 'Incorrect PIN. Please check with the customer.');
      } else {
        Alert.alert('Error', 'Failed to mark as delivered');
      }
    }
  };

  const openCamera = async (order) => {
    if (!permission?.granted) {
      const { status } = await requestPermission();
      if (status !== 'granted') {
        Alert.alert('Error', 'Camera permission is required');
        return;
      }
    }
    setSelectedOrder(order);
    setCameraVisible(true);
  };

  const uploadImageToCDN = async (uri) => {
    // Mock upload
    return `https://joymart-cdn.fake/pod_${Date.now()}.jpg`;
  };

  const takePoDPhoto = async () => {
    if (cameraRef) {
      try {
        const photo = await cameraRef.takePictureAsync();
        const manipResult = await ImageManipulator.manipulateAsync(
          photo.uri,
          [{ resize: { width: 800 } }],
          { compress: 0.7 }
        );
        const url = await uploadImageToCDN(manipResult.uri);
        setPhotoUrlMap(prev => ({ ...prev, [selectedOrder.id]: url }));
        setCameraVisible(false);
        Alert.alert("Success", "PoD photo attached!");
      } catch (e) {
        Alert.alert("Error", "Failed to take photo");
      }
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.orderId}>Order #{item.id}</Text>
          <View style={styles.badges}>
            <Text style={styles.badgeTextPayment}>{item.payment_method}</Text>
            <Text style={styles.badgeTextSlot}>{item.delivery_slot || 'Immediate'}</Text>
          </View>
        </View>
        <Text style={styles.totalAmount}>₹{item.total_amount.toFixed(2)}</Text>
      </View>

      <View style={styles.customerInfo}>
        <Text style={styles.infoText}>👤 {item.user?.name || 'Customer'}</Text>
        <Text style={styles.infoText}>📞 {item.user?.phone || 'N/A'}</Text>
        <Text style={styles.infoText}>📍 {item.user?.flat_number ? `${item.user.flat_number}, ` : ''}{item.user?.society?.name || 'Address N/A'}</Text>
        {item.delivery_instructions && (
          <View style={styles.noteBox}>
            <Text style={styles.noteText}>Note: {item.delivery_instructions}</Text>
          </View>
        )}
      </View>

      <View style={styles.actionsContainer}>
        {item.payment_method !== 'Cash' && !photoUrlMap[item.id] && (
          <TouchableOpacity 
            style={[styles.actionBtn, styles.photoBtn]} 
            onPress={() => openCamera(item)}
          >
            <Text style={styles.actionBtnText}>Take PoD Photo</Text>
          </TouchableOpacity>
        )}
        {photoUrlMap[item.id] && (
          <View style={styles.photoAttachedBox}>
            <Text style={styles.photoAttachedText}>✅ PoD Photo Attached</Text>
          </View>
        )}
        <TouchableOpacity 
          style={styles.actionBtn} 
          onPress={() => markDelivered(item)}
        >
          <Text style={styles.actionBtnText}>Mark Delivered</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>My Deliveries</Text>
      {loading ? (
        <Text style={styles.loadingText}>Loading deliveries...</Text>
      ) : deliveries.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyTitle}>No active deliveries!</Text>
          <Text style={styles.emptySubtitle}>Pull down to refresh...</Text>
        </View>
      ) : (
        <FlatList
          data={deliveries}
          keyExtractor={item => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      )}

      {/* OTP Modal */}
      <Modal visible={otpModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Enter 4-Digit Customer PIN</Text>
            <Text style={styles.modalSubtitle}>Please collect cash and ask customer for OTP</Text>
            <TextInput
              style={styles.otpInput}
              keyboardType="number-pad"
              maxLength={4}
              value={enteredOtp}
              onChangeText={setEnteredOtp}
              placeholder="0000"
              textAlign="center"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalBtn, styles.btnCancel]} onPress={() => setOtpModalVisible(false)}>
                <Text style={styles.btnCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.btnSubmit]} onPress={submitOTP}>
                <Text style={styles.btnSubmitText}>Submit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Camera Modal */}
      <Modal visible={cameraVisible} animationType="slide">
        <View style={{ flex: 1, backgroundColor: '#000' }}>
          <CameraView style={{ flex: 1 }} facing="back" ref={(ref) => setCameraRef(ref)}>
            <View style={styles.cameraOverlay}>
              <TouchableOpacity style={styles.closeCameraBtn} onPress={() => setCameraVisible(false)}>
                <Text style={styles.closeCameraText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.captureBtn} onPress={takePoDPhoto}>
                <View style={styles.captureBtnInner} />
              </TouchableOpacity>
            </View>
          </CameraView>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f8fafc' },
  headerTitle: { fontSize: 24, fontWeight: '900', color: '#0f172a', marginBottom: 16 },
  loadingText: { textAlign: 'center', marginTop: 40, color: '#64748b', fontWeight: 'bold' },
  emptyBox: { backgroundColor: '#fff', padding: 40, borderRadius: 24, alignItems: 'center', borderWidth: 2, borderColor: '#f1f5f9', borderStyle: 'dashed', marginTop: 20 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#94a3b8', marginBottom: 8 },
  emptySubtitle: { color: '#cbd5e1' },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingBottom: 16, marginBottom: 16 },
  orderId: { fontSize: 20, fontWeight: '900', color: '#0f172a' },
  badges: { flexDirection: 'row', gap: 8, marginTop: 6 },
  badgeTextPayment: { backgroundColor: '#f1f5f9', color: '#475569', fontSize: 10, fontWeight: 'bold', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, overflow: 'hidden' },
  badgeTextSlot: { backgroundColor: '#ecfdf5', color: '#059669', fontSize: 10, fontWeight: 'bold', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, overflow: 'hidden' },
  totalAmount: { fontSize: 22, fontWeight: '900', color: '#10b981' },
  customerInfo: { backgroundColor: '#f8fafc', borderRadius: 12, padding: 16, gap: 8 },
  infoText: { fontSize: 14, fontWeight: 'bold', color: '#334155' },
  noteBox: { backgroundColor: '#fffbeb', padding: 8, borderRadius: 8, marginTop: 4 },
  noteText: { color: '#d97706', fontWeight: 'bold', fontSize: 12 },
  actionsContainer: { marginTop: 16, gap: 12 },
  actionBtn: { backgroundColor: '#0f172a', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  photoBtn: { backgroundColor: '#10b981' },
  actionBtnText: { color: '#fff', fontSize: 16, fontWeight: '900' },
  photoAttachedBox: { backgroundColor: '#ecfdf5', padding: 12, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#a7f3d0' },
  photoAttachedText: { color: '#059669', fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.8)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 24, width: '100%', padding: 24, alignItems: 'center' },
  modalTitle: { fontSize: 20, fontWeight: '900', color: '#0f172a', marginBottom: 8 },
  modalSubtitle: { fontSize: 14, color: '#64748b', marginBottom: 24, textAlign: 'center' },
  otpInput: { backgroundColor: '#f8fafc', width: '100%', fontSize: 32, fontWeight: '900', letterSpacing: 8, padding: 16, borderRadius: 16, borderBottomWidth: 4, borderBottomColor: '#10b981', marginBottom: 24 },
  modalActions: { flexDirection: 'row', gap: 12, width: '100%' },
  modalBtn: { flex: 1, paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
  btnCancel: { backgroundColor: '#f1f5f9' },
  btnCancelText: { color: '#475569', fontWeight: 'bold' },
  btnSubmit: { backgroundColor: '#10b981' },
  btnSubmitText: { color: '#fff', fontWeight: '900' },
  cameraOverlay: { flex: 1, justifyContent: 'space-between', padding: 20, paddingBottom: 40 },
  closeCameraBtn: { alignSelf: 'flex-start', marginTop: 40, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  closeCameraText: { color: '#fff', fontWeight: 'bold' },
  captureBtn: { alignSelf: 'center', width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center' },
  captureBtnInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#fff' }
});
