import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  ActivityIndicator, Alert, Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const STEPS = ['Restaurant Info', 'Location & Hours', 'Menu Setup', 'Review'];

export default function RestaurantOnboarding() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const [restaurantName, setRestaurantName] = useState('');
  const [businessReg, setBusinessReg] = useState('');
  const [kraPin, setKraPin] = useState('');
  const [cuisineType, setCuisineType] = useState('');
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [hasDelivery, setHasDelivery] = useState(false);
  const [hasPickup, setHasPickup] = useState(false);
  const [hasDineIn, setHasDineIn] = useState(false);
  const [openingTime, setOpeningTime] = useState('08:00');
  const [closingTime, setClosingTime] = useState('22:00');
  const [menuItems, setMenuItems] = useState<{ name: string; price: string; category: string }[]>([]);
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('');

  const cuisineOptions = [
    'Kenyan', 'Nigerian', 'Ethiopian', 'Indian', 'Chinese',
    'Italian', 'Fast Food', 'Seafood', 'Vegetarian', 'BBQ',
  ];

  const validateStep = () => {
    switch (step) {
      case 0:
        if (!restaurantName.trim()) return 'Restaurant name is required';
        if (!businessReg.trim()) return 'Business registration number is required';
        if (!kraPin.trim()) return 'KRA PIN is required';
        if (!cuisineType.trim()) return 'Cuisine type is required';
        break;
      case 1:
        if (!phone.trim()) return 'Phone number is required';
        if (!address.trim()) return 'Address is required';
        if (!city.trim()) return 'City is required';
        break;
      case 2:
        if (!hasDelivery && !hasPickup && !hasDineIn) return 'Select at least one service type';
        break;
    }
    return null;
  };

  const handleNext = () => {
    const error = validateStep();
    if (error) { Alert.alert('Validation Error', error); return; }
    if (step < STEPS.length - 1) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
    else router.back();
  };

  const addMenuItem = () => {
    if (!newItemName.trim() || !newItemPrice.trim()) return;
    setMenuItems([...menuItems, {
      name: newItemName.trim(),
      price: newItemPrice.trim(),
      category: newItemCategory.trim() || 'General',
    }]);
    setNewItemName('');
    setNewItemPrice('');
    setNewItemCategory('');
  };

  const removeMenuItem = (index: number) => {
    setMenuItems(menuItems.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    const error = validateStep();
    if (error) { Alert.alert('Validation Error', error); return; }
    if (!user) { Alert.alert('Error', 'You must be logged in'); return; }

    setLoading(true);
    try {
      const { data: restaurant, error: restError } = await supabase
        .from('restaurants')
        .insert({
          owner_id: user.id,
          name: restaurantName.trim(),
          business_reg: businessReg.trim(),
          kra_pin: kraPin.trim(),
          cuisine_type: cuisineType.trim(),
          description: description.trim(),
          phone: phone.trim(),
          email: email.trim(),
          address: address.trim(),
          city: city.trim(),
          has_delivery: hasDelivery,
          has_pickup: hasPickup,
          has_dine_in: hasDineIn,
          opening_time: openingTime,
          closing_time: closingTime,
          status: 'pending_verification',
          rating: 0,
          total_orders: 0,
          is_open: false,
        })
        .select()
        .single();

      if (restError) throw restError;

      if (restaurant && menuItems.length > 0) {
        const menuData = menuItems.map((item: any) => ({
          restaurant_id: restaurant.id,
          name: item.name,
          price: parseFloat(item.price) || 0,
          category_id: null, // Will be linked later
          is_available: true,
        }));

        const { error: menuError } = await supabase.from('restaurant_menu_items').insert(menuData);
        if (menuError) throw menuError;
      }

      Alert.alert(
        'Restaurant Registered',
        'Your restaurant is pending verification. You can start setting up your menu while waiting for approval.',
        [{ text: 'OK', onPress: () => router.replace('/(restaurant)') }]
      );
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to register restaurant');
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {STEPS.map((s, i) => (
        <View key={s} style={styles.stepRow}>
          <View style={[styles.stepDot, i <= step && styles.stepDotActive]}>
            <Text style={[styles.stepNumber, i <= step && styles.stepNumberActive]}>{i + 1}</Text>
          </View>
          {i < STEPS.length - 1 && <View style={[styles.stepLine, i < step && styles.stepLineActive]} />}
          <Text style={[styles.stepLabel, i <= step && styles.stepLabelActive]}>{s}</Text>
        </View>
      ))}
    </View>
  );

  const renderStepContent = () => {
    switch (step) {
      case 0:
        return (
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Restaurant Information</Text>
            <Input label="Restaurant Name *" value={restaurantName} onChangeText={setRestaurantName} icon="store" />
            <Input label="Business Registration No. *" value={businessReg} onChangeText={setBusinessReg} icon="file-document" />
            <Input label="KRA PIN *" value={kraPin} onChangeText={setKraPin} icon="identifier" />
            <Text style={styles.label}>Cuisine Type *</Text>
            <View style={styles.chipContainer}>
              {cuisineOptions.map((cuisine: any) => (
                <TouchableOpacity key={cuisine} style={[styles.chip, cuisineType === cuisine && styles.chipActive]} onPress={() => setCuisineType(cuisine)}>
                  <Text style={[styles.chipText, cuisineType === cuisine && styles.chipTextActive]}>{cuisine}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Input label="Description" value={description} onChangeText={setDescription} icon="text" placeholder="Describe your restaurant" multiline />
          </View>
        );
      case 1:
        return (
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Location & Contact</Text>
            <Input label="Phone *" value={phone} onChangeText={setPhone} icon="phone" keyboardType="phone-pad" />
            <Input label="Email" value={email} onChangeText={setEmail} icon="email" keyboardType="email-address" />
            <Input label="Address *" value={address} onChangeText={setAddress} icon="map-marker" />
            <Input label="City *" value={city} onChangeText={setCity} icon="city" />
            <Text style={styles.sectionTitle}>Operating Hours</Text>
            <View style={styles.timeRow}>
              <View style={styles.timeInput}>
                <Text style={styles.label}>Opens</Text>
                <TextInput style={styles.input} value={openingTime} onChangeText={setOpeningTime} placeholder="08:00" />
              </View>
              <View style={styles.timeInput}>
                <Text style={styles.label}>Closes</Text>
                <TextInput style={styles.input} value={closingTime} onChangeText={setClosingTime} placeholder="22:00" />
              </View>
            </View>
            <Text style={styles.sectionTitle}>Service Types</Text>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Delivery</Text>
              <Switch value={hasDelivery} onValueChange={setHasDelivery} trackColor={{ false: '#E5E7EB', true: '#2563EB' }} />
            </View>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Pickup</Text>
              <Switch value={hasPickup} onValueChange={setHasPickup} trackColor={{ false: '#E5E7EB', true: '#2563EB' }} />
            </View>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Dine-in</Text>
              <Switch value={hasDineIn} onValueChange={setHasDineIn} trackColor={{ false: '#E5E7EB', true: '#2563EB' }} />
            </View>
          </View>
        );
      case 2:
        return (
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Menu Items (Optional)</Text>
            {menuItems.map((item, index) => (
              <View key={index} style={styles.menuItemRow}>
                <Text style={styles.menuItemText}>{item.name} — KES {item.price}</Text>
                <TouchableOpacity onPress={() => removeMenuItem(index)}>
                  <MaterialCommunityIcons name="close-circle" size={20} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ))}
            <Input label="Item Name" value={newItemName} onChangeText={setNewItemName} icon="food" />
            <Input label="Price (KES)" value={newItemPrice} onChangeText={setNewItemPrice} icon="cash" keyboardType="decimal-pad" />
            <Input label="Category" value={newItemCategory} onChangeText={setNewItemCategory} icon="tag" placeholder="e.g. Main Course, Drink" />
            <TouchableOpacity style={styles.addButton} onPress={addMenuItem}>
              <MaterialCommunityIcons name="plus" size={18} color="#2563EB" />
              <Text style={styles.addButtonText}>Add Item</Text>
            </TouchableOpacity>
          </View>
        );
      case 3:
        return (
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Review Your Restaurant</Text>
            <ReviewRow label="Name" value={restaurantName} />
            <ReviewRow label="Registration" value={businessReg} />
            <ReviewRow label="KRA PIN" value={kraPin} />
            <ReviewRow label="Cuisine" value={cuisineType} />
            <ReviewRow label="Contact" value={`${phone}${email ? ' / ' + email : ''}`} />
            <ReviewRow label="Address" value={`${address}, ${city}`} />
            <ReviewRow label="Hours" value={`${openingTime} — ${closingTime}`} />
            <ReviewRow label="Services" value={[
              hasDelivery && 'Delivery',
              hasPickup && 'Pickup',
              hasDineIn && 'Dine-in',
            ].filter(Boolean).join(', ')} />
            <ReviewRow label="Menu Items" value={`${menuItems.length} items`} />
          </View>
        );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Register Restaurant</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {renderStepIndicator()}
        {renderStepContent()}
        <View style={{ height: 40 }} />
      </ScrollView>
      <View style={styles.footer}>
        {step > 0 && (
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        )}
        {step < STEPS.length - 1 ? (
          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.nextButtonText}>Next</Text>
            <MaterialCommunityIcons name="arrow-right" size={18} color="#FFF" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.nextButton, loading && styles.nextButtonDisabled]} onPress={handleSubmit} disabled={loading}>
            {loading ? <ActivityIndicator color="#FFF" /> : (
              <><Text style={styles.nextButtonText}>Register Restaurant</Text><MaterialCommunityIcons name="check" size={18} color="#FFF" /></>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

function Input({ label, value, onChangeText, icon, keyboardType = 'default', placeholder, multiline }: any) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputWrapper, multiline && { height: 100, alignItems: 'flex-start', paddingTop: 12 }]}>
        <MaterialCommunityIcons name={icon} size={18} color="#9CA3AF" style={styles.inputIcon} />
        <TextInput 
          style={[styles.input, multiline && { height: 80, textAlignVertical: 'top' }]} 
          value={value} 
          onChangeText={onChangeText} 
          keyboardType={keyboardType} 
          placeholder={placeholder} 
          placeholderTextColor="#9CA3AF"
          multiline={multiline}
        />
      </View>
    </View>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <View style={styles.reviewRow}>
      <Text style={styles.reviewLabel}>{label}</Text>
      <Text style={styles.reviewValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#1F2937' },
  scroll: { flex: 1, paddingHorizontal: 16 },
  stepIndicator: { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-start', paddingVertical: 20 },
  stepRow: { alignItems: 'center', marginHorizontal: 4 },
  stepDot: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center' },
  stepDotActive: { backgroundColor: '#2563EB' },
  stepNumber: { fontSize: 13, fontWeight: '700', color: '#9CA3AF' },
  stepNumberActive: { color: '#FFF' },
  stepLine: { width: 24, height: 2, backgroundColor: '#E5E7EB', marginVertical: 6 },
  stepLineActive: { backgroundColor: '#2563EB' },
  stepLabel: { fontSize: 10, color: '#9CA3AF', marginTop: 4, maxWidth: 60, textAlign: 'center' },
  stepLabelActive: { color: '#2563EB', fontWeight: '600' },
  formSection: { marginTop: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937', marginBottom: 16, marginTop: 16 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', paddingHorizontal: 12 },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, height: 48, fontSize: 15, color: '#1F2937' },
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB' },
  chipActive: { backgroundColor: '#DBEAFE', borderColor: '#2563EB' },
  chipText: { fontSize: 13, color: '#6B7280' },
  chipTextActive: { color: '#2563EB', fontWeight: '600' },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  switchLabel: { fontSize: 15, color: '#374151', fontWeight: '500' },
  timeRow: { flexDirection: 'row', gap: 12 },
  timeInput: { flex: 1 },
  menuItemRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, paddingHorizontal: 12, backgroundColor: '#F3F4F6', borderRadius: 8, marginBottom: 8 },
  menuItemText: { fontSize: 14, color: '#1F2937', fontWeight: '500' },
  addButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderWidth: 1, borderColor: '#2563EB', borderRadius: 12, borderStyle: 'dashed' },
  addButtonText: { fontSize: 14, color: '#2563EB', fontWeight: '600', marginLeft: 8 },
  reviewRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  reviewLabel: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
  reviewValue: { fontSize: 13, color: '#1F2937', fontWeight: '600', flex: 1, textAlign: 'right', marginLeft: 12 },
  footer: { flexDirection: 'row', padding: 16, gap: 12, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  backButton: { flex: 1, height: 50, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center' },
  backButtonText: { fontSize: 15, fontWeight: '600', color: '#6B7280' },
  nextButton: { flex: 2, height: 50, borderRadius: 12, backgroundColor: '#2563EB', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  nextButtonDisabled: { backgroundColor: '#93C5FD' },
  nextButtonText: { fontSize: 15, fontWeight: '700', color: '#FFF' },
});
