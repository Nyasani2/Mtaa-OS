import React, { useState, useEffect, useCallback } from 'react';
import { Alert, View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, Modal, TextInput } from 'react-native';
import { Alert, SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Alert, Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { Alert, shopService } from '@/domains/shop/services/shopService';
import { Alert, shopPaymentService } from '@/domains/shop/services/shopPaymentService';

interface CartItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export default function ShopCheckoutScreen() {
  const router = useRouter();
  const {
    shopId,
    posSessionId,
    paymentMethod: initialMethod,
    cart: cartParam,
    total: totalParam,
    cashReceived,
    cashChange,
  } = useLocalSearchParams<{
    shopId: string;
    posSessionId?: string;
    paymentMethod?: string;
    cart?: string;
    total?: string;
    cashReceived?: string;
    cashChange?: string;
  }>();

  const { user, verifyPin } = useAuthStore();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [shop, setShop] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'cash' | 'card' | 'escrow'>('wallet');
  const [loading, setLoading] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [deliveryType, setDeliveryType] = useState<'pickup' | 'delivery'>('pickup');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  const subtotal = cart.reduce((s, i) => s + i.total_price, 0);
  const taxRate = shop?.settings?.tax_rate || 16;
  const taxAmount = Math.round(subtotal * (taxRate / 100) * 100) / 100;
  const deliveryFee = deliveryType === 'delivery' ? (shop?.settings?.delivery_fee || 0) : 0;
  const total = subtotal + taxAmount + deliveryFee;

  useEffect(() => {
    if (cartParam) {
      try { setCart(JSON.parse(cartParam)); } catch { setCart([]); }
    }
    if (initialMethod) {
      setPaymentMethod(initialMethod as any);
    }
    if (shopId) {
      shopService.getShopById(shopId).then(setShop);
    }
  }, [cartParam, initialMethod, shopId]);

  async function handleWalletPayment() {
    if (!user?.id) {
      Alert.alert('Sign In Required', 'Please sign in to pay with wallet.');
      return;
    }
    setShowPinModal(true);
  }

  async function confirmPinPayment() {
    if (!pin || pin.length < 4) {
      setPinError('Enter a valid PIN');
      return;
    }
    setProcessing(true);
    setPinError('');

    try {
      const valid = await verifyPin(pin);
      if (!valid) {
        setPinError('Incorrect PIN. Please try again.');
        setProcessing(false);
        return;
      }

      // PIN verified — process payment
      setShowPinModal(false);
      setPin('');
      await executePayment('wallet');
    } catch (err: any) {
      setPinError(err.message || 'PIN verification failed');
    } finally {
      setProcessing(false);
    }
  }

  async function executePayment(method: 'wallet' | 'cash' | 'card' | 'escrow') {
    if (!user?.id || !shopId) return;
    setLoading(true);

    try {
      const result = await shopPaymentService.processWalletPayment({
        shopId,
        customerId: user.id,
        items: cart,
        subtotal,
        taxAmount,
        deliveryFee,
        discountAmount: 0,
        totalAmount: total,
        paymentMethod: method,
        deliveryType,
        deliveryAddress: deliveryType === 'delivery' ? deliveryAddress : undefined,
        customerName: customerName || undefined,
        customerPhone: customerPhone || undefined,
        posSessionId: posSessionId || undefined,
      });

      if (result.success) {
        Alert.alert(
          'Payment Successful',
          result.message,
          [{ text: 'Done', onPress: () => router.replace('/(commerce)/shop/orders' as any) }]
        );
      } else {
        Alert.alert('Payment Failed', result.message);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Payment could not be processed');
    } finally {
      setLoading(false);
    }
  }

  function handleCashPayment() {
    executePayment('cash');
  }

  function handleCardPayment() {
    Alert.alert('Card Payment', 'Card terminal integration required. Proceeding as pending.');
    executePayment('card');
  }

  function handleEscrowPayment() {
    executePayment('escrow');
  }

  const isCash = paymentMethod === 'cash';
  const isPOS = !!posSessionId;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Checkout</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Shop Info */}
        {shop && (
          <View style={styles.shopCard}>
            <Text style={styles.shopName}>{shop.name}</Text>
            <Text style={styles.shopCategory}>{shop.category} • {shop.location || 'No location'}</Text>
          </View>
        )}

        {/* Order Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          {cart.map((item, idx) => (
            <View key={idx} style={styles.itemRow}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.product_name}</Text>
                <Text style={styles.itemMeta}>{item.quantity} × KES {item.unit_price.toLocaleString()}</Text>
              </View>
              <Text style={styles.itemTotal}>KES {item.total_price.toLocaleString()}</Text>
            </View>
          ))}
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>KES {subtotal.toLocaleString()}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tax ({taxRate}%)</Text>
            <Text style={styles.totalValue}>KES {taxAmount.toLocaleString()}</Text>
          </View>
          {deliveryFee > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Delivery</Text>
              <Text style={styles.totalValue}>KES {deliveryFee.toLocaleString()}</Text>
            </View>
          )}
          <View style={[styles.totalRow, styles.grandTotal]}>
            <Text style={styles.grandTotalLabel}>Total</Text>
            <Text style={styles.grandTotalValue}>KES {total.toLocaleString()}</Text>
          </View>
        </View>

        {/* Delivery Options (non-POS) */}
        {!isPOS && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Delivery</Text>
            <View style={styles.deliveryRow}>
              <TouchableOpacity
                style={[styles.deliveryBtn, deliveryType === 'pickup' && styles.deliveryBtnActive]}
                onPress={() => setDeliveryType('pickup')}
              >
                <Ionicons name="storefront" size={20} color={deliveryType === 'pickup' ? '#2196F3' : '#64748B'} />
                <Text style={[styles.deliveryText, deliveryType === 'pickup' && styles.deliveryTextActive]}>Pickup</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.deliveryBtn, deliveryType === 'delivery' && styles.deliveryBtnActive]}
                onPress={() => setDeliveryType('delivery')}
              >
                <Ionicons name="bicycle" size={20} color={deliveryType === 'delivery' ? '#2196F3' : '#64748B'} />
                <Text style={[styles.deliveryText, deliveryType === 'delivery' && styles.deliveryTextActive]}>Delivery</Text>
              </TouchableOpacity>
            </View>
            {deliveryType === 'delivery' && (
              <TextInput
                style={styles.input}
                placeholder="Delivery address"
                value={deliveryAddress}
                onChangeText={setDeliveryAddress}
              />
            )}
          </View>
        )}

        {/* Customer Info (non-POS) */}
        {!isPOS && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Customer Details</Text>
            <TextInput style={styles.input} placeholder="Name (optional)" value={customerName} onChangeText={setCustomerName} />
            <TextInput style={styles.input} placeholder="Phone (optional)" value={customerPhone} onChangeText={setCustomerPhone} keyboardType="phone-pad" />
          </View>
        )}

        {/* Payment Method */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <View style={styles.payMethods}>
            <TouchableOpacity
              style={[styles.payMethod, paymentMethod === 'wallet' && styles.payMethodActive]}
              onPress={() => setPaymentMethod('wallet')}
            >
              <Ionicons name="wallet" size={22} color={paymentMethod === 'wallet' ? '#2196F3' : '#64748B'} />
              <Text style={[styles.payMethodText, paymentMethod === 'wallet' && styles.payMethodTextActive]}>Wallet</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.payMethod, paymentMethod === 'cash' && styles.payMethodActive]}
              onPress={() => setPaymentMethod('cash')}
            >
              <Ionicons name="cash" size={22} color={paymentMethod === 'cash' ? '#10B981' : '#64748B'} />
              <Text style={[styles.payMethodText, paymentMethod === 'cash' && styles.payMethodTextActive]}>Cash</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.payMethod, paymentMethod === 'card' && styles.payMethodActive]}
              onPress={() => setPaymentMethod('card')}
            >
              <Ionicons name="card" size={22} color={paymentMethod === 'card' ? '#8B5CF6' : '#64748B'} />
              <Text style={[styles.payMethodText, paymentMethod === 'card' && styles.payMethodTextActive]}>Card</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.payMethod, paymentMethod === 'escrow' && styles.payMethodActive]}
              onPress={() => setPaymentMethod('escrow')}
            >
              <Ionicons name="shield-checkmark" size={22} color={paymentMethod === 'escrow' ? '#F59E0B' : '#64748B'} />
              <Text style={[styles.payMethodText, paymentMethod === 'escrow' && styles.payMethodTextActive]}>Escrow</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Cash Details */}
        {isCash && cashReceived && (
          <View style={styles.cashDetail}>
            <Text style={styles.cashLabel}>Cash Received: KES {parseFloat(cashReceived).toLocaleString()}</Text>
            <Text style={styles.cashLabel}>Change Due: KES {parseFloat(cashChange || '0').toLocaleString()}</Text>
          </View>
        )}
      </ScrollView>

      {/* Pay Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.payBtn, loading && styles.payBtnDisabled]}
          onPress={() => {
            if (paymentMethod === 'wallet') handleWalletPayment();
            else if (paymentMethod === 'cash') handleCashPayment();
            else if (paymentMethod === 'card') handleCardPayment();
            else if (paymentMethod === 'escrow') handleEscrowPayment();
          }}
          disabled={loading || cart.length === 0}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.payBtnText}>
              Pay KES {total.toLocaleString()} {paymentMethod === 'escrow' ? '(Escrow)' : ''}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* PIN Modal — Reuses existing auth pinEngine, NO duplicate system */}
      <Modal visible={showPinModal} transparent animationType="fade">
        <View style={styles.pinOverlay}>
          <View style={styles.pinContent}>
            <Ionicons name="lock-closed" size={40} color="#2196F3" />
            <Text style={styles.pinTitle}>Enter Wallet PIN</Text>
            <Text style={styles.pinSub}>Verify your identity to complete payment</Text>

            <View style={styles.pinDisplay}>
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <View key={i} style={[styles.pinDot, pin.length > i && styles.pinDotFilled]} />
              ))}
            </View>

            {pinError ? <Text style={styles.pinError}>{pinError}</Text> : null}

            <View style={styles.pinKeypad}>
              {[['1', '2', '3'], ['4', '5', '6'], ['7', '8', '9'], ['C', '0', '⌫']].map((row, ri) => (
                <View key={ri} style={styles.pinKeypadRow}>
                  {row.map((key) => (
                    <TouchableOpacity
                      key={key}
                      style={styles.pinKey}
                      onPress={() => {
                        if (key === 'C') { setPin(''); setPinError(''); }
                        else if (key === '⌫') { setPin((p) => p.slice(0, -1)); setPinError(''); }
                        else if (pin.length < 6) { setPin((p) => p + key); setPinError(''); }
                      }}
                    >
                      <Text style={styles.pinKeyText}>{key}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ))}
            </View>

            <View style={styles.pinActions}>
              <TouchableOpacity style={styles.pinCancel} onPress={() => { setShowPinModal(false); setPin(''); setPinError(''); }}>
                <Text style={styles.pinCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.pinConfirm, pin.length < 4 && styles.pinConfirmDisabled]}
                onPress={confirmPinPayment}
                disabled={pin.length < 4 || processing}
              >
                {processing ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.pinConfirmText}>Confirm</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  shopCard: { margin: 16, marginTop: 0, padding: 16, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  shopName: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  shopCategory: { fontSize: 13, color: '#64748B', marginTop: 2 },
  section: { padding: 16, backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 12, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#0F172A', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: '600', color: '#0F172A' },
  itemMeta: { fontSize: 12, color: '#64748B', marginTop: 2 },
  itemTotal: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  divider: { height: 1, backgroundColor: '#E2E8F0', marginVertical: 12 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  totalLabel: { fontSize: 14, color: '#64748B' },
  totalValue: { fontSize: 14, fontWeight: '600', color: '#0F172A' },
  grandTotal: { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  grandTotalLabel: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  grandTotalValue: { fontSize: 16, fontWeight: '800', color: '#2196F3' },
  deliveryRow: { flexDirection: 'row', gap: 12 },
  deliveryBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, borderRadius: 12, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0' },
  deliveryBtnActive: { borderColor: '#2196F3', backgroundColor: '#EFF6FF' },
  deliveryText: { fontSize: 14, fontWeight: '600', color: '#64748B' },
  deliveryTextActive: { color: '#2196F3' },
  input: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 14, fontSize: 15, marginTop: 8 },
  payMethods: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  payMethod: { width: '23%', alignItems: 'center', padding: 12, borderRadius: 12, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0' },
  payMethodActive: { borderColor: '#2196F3', backgroundColor: '#EFF6FF' },
  payMethodText: { fontSize: 11, fontWeight: '600', color: '#64748B', marginTop: 6 },
  payMethodTextActive: { color: '#2196F3' },
  cashDetail: { marginHorizontal: 16, marginBottom: 12, padding: 12, backgroundColor: '#ECFDF5', borderRadius: 8 },
  cashLabel: { fontSize: 13, color: '#059669', fontWeight: '600' },
  footer: { padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  payBtn: { backgroundColor: '#2196F3', padding: 16, borderRadius: 12, alignItems: 'center' },
  payBtnDisabled: { opacity: 0.5 },
  payBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  pinOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  pinContent: { width: 320, backgroundColor: '#fff', borderRadius: 20, padding: 24, alignItems: 'center' },
  pinTitle: { fontSize: 20, fontWeight: '800', color: '#0F172A', marginTop: 12 },
  pinSub: { fontSize: 13, color: '#64748B', marginTop: 4, textAlign: 'center' },
  pinDisplay: { flexDirection: 'row', gap: 12, marginTop: 20, marginBottom: 8 },
  pinDot: { width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: '#CBD5E1' },
  pinDotFilled: { backgroundColor: '#2196F3', borderColor: '#2196F3' },
  pinError: { color: '#DC2626', fontSize: 12, marginBottom: 8 },
  pinKeypad: { width: 240, marginTop: 8 },
  pinKeypadRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12 },
  pinKey: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center' },
  pinKeyText: { fontSize: 22, fontWeight: '600', color: '#0F172A' },
  pinActions: { flexDirection: 'row', gap: 12, marginTop: 16, width: '100%' },
  pinCancel: { flex: 1, padding: 12, borderRadius: 10, backgroundColor: '#F1F5F9', alignItems: 'center' },
  pinCancelText: { color: '#64748B', fontWeight: '600' },
  pinConfirm: { flex: 1, padding: 12, borderRadius: 10, backgroundColor: '#2196F3', alignItems: 'center' },
  pinConfirmDisabled: { opacity: 0.4 },
  pinConfirmText: { color: '#fff', fontWeight: '700' },
});
