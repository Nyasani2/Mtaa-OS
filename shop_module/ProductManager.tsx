// components/shop/ProductManager.tsx
import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, Image, Alert, Modal, ScrollView } from "react-native";
import { useShopProducts } from "@/lib/shop/hooks/useShop";
import { ShopService } from "@/lib/shop/services/shopService";
import { ShopProduct } from "@/lib/shop/types";

interface ProductManagerProps {
  shopId: string;
}

export default function ProductManager({ shopId }: ProductManagerProps) {
  const { products, loading, refresh } = useShopProducts(shopId);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ShopProduct | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [form, setForm] = useState({
    name: "", description: "", sku: "", barcode: "", base_price: "", sale_price: "", cost_price: "",
    stock_quantity: "", stock_alert_level: "10", category_id: "", images: [] as string[],
    is_active: true, track_inventory: true,
  });

  const openEdit = (product: ShopProduct) => {
    setEditingProduct(product);
    setForm({
      name: product.name, description: product.description || "", sku: product.sku || "",
      barcode: product.barcode || "", base_price: product.base_price.toString(),
      sale_price: product.sale_price?.toString() || "", cost_price: product.cost_price?.toString() || "",
      stock_quantity: product.stock_quantity.toString(), stock_alert_level: product.stock_alert_level.toString(),
      category_id: product.category_id || "", images: product.images, is_active: product.is_active,
      track_inventory: product.track_inventory,
    });
    setModalVisible(true);
  };

  const openCreate = () => {
    setEditingProduct(null);
    setForm({ name: "", description: "", sku: "", barcode: "", base_price: "", sale_price: "", cost_price: "",
      stock_quantity: "", stock_alert_level: "10", category_id: "", images: [], is_active: true, track_inventory: true });
    setModalVisible(true);
  };

  const handleSave = async () => {
    try {
      const data = {
        shop_id: shopId, name: form.name, description: form.description, sku: form.sku, barcode: form.barcode,
        base_price: parseFloat(form.base_price), sale_price: form.sale_price ? parseFloat(form.sale_price) : null,
        cost_price: form.cost_price ? parseFloat(form.cost_price) : null,
        stock_quantity: parseInt(form.stock_quantity) || 0, stock_alert_level: parseInt(form.stock_alert_level) || 10,
        category_id: form.category_id || null, images: form.images, is_active: form.is_active, track_inventory: form.track_inventory,
      };
      if (editingProduct) {
        await ShopService.updateProduct(editingProduct.id, data);
        Alert.alert("Updated", "Product updated successfully");
      } else {
        await ShopService.createProduct(data);
        Alert.alert("Created", "Product added successfully");
      }
      setModalVisible(false);
      refresh();
    } catch (e) {
      Alert.alert("Error", (e as Error).message);
    }
  };

  const handleDelete = (product: ShopProduct) => {
    Alert.alert("Delete Product", `Delete ${product.name}?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => { await ShopService.deleteProduct(product.id); refresh(); }},
    ]);
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.barcode?.includes(searchQuery)
  );

  const renderProduct = ({ item }: { item: ShopProduct }) => (
    <TouchableOpacity style={styles.productCard} onPress={() => openEdit(item)}>
      <View style={styles.productImageContainer}>
        {item.images?.[0] ? (
          <Image source={{ uri: item.images[0] }} style={styles.productImage} />
        ) : (
          <View style={styles.productImagePlaceholder}><Text style={styles.placeholderText}>📦</Text></View>
        )}
        {!item.is_active && <View style={styles.inactiveBadge}><Text style={styles.inactiveText}>Inactive</Text></View>}
        {item.stock_quantity <= item.stock_alert_level && item.track_inventory && (
          <View style={styles.lowStockBadge}><Text style={styles.lowStockText}>Low Stock</Text></View>
        )}
      </View>
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productSku}>SKU: {item.sku || "N/A"} | Barcode: {item.barcode || "N/A"}</Text>
        <View style={styles.priceRow}>
          <Text style={styles.salePrice}>R{item.sale_price?.toFixed(2) || item.base_price.toFixed(2)}</Text>
          {item.sale_price && <Text style={styles.basePrice}>R{item.base_price.toFixed(2)}</Text>}
        </View>
        <Text style={styles.stockText}>Stock: {item.stock_quantity} units</Text>
      </View>
      <TouchableOpacity onPress={() => handleDelete(item)} style={styles.deleteBtn}>
        <Text style={styles.deleteBtnText}>🗑️</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Products</Text>
        <TouchableOpacity onPress={openCreate} style={styles.addBtn}>
          <Text style={styles.addBtnText}>+ Add Product</Text>
        </TouchableOpacity>
      </View>
      <TextInput style={styles.searchInput} placeholder="Search by name, SKU, or barcode..." placeholderTextColor="#64748b" value={searchQuery} onChangeText={setSearchQuery} />
      <FlatList data={filteredProducts} renderItem={renderProduct} keyExtractor={(item) => item.id} contentContainerStyle={styles.list} ListEmptyComponent={<Text style={styles.empty}>No products found</Text>} />
      <Modal visible={modalVisible} animationType="slide">
        <ScrollView style={styles.modalContainer}>
          <Text style={styles.modalTitle}>{editingProduct ? "Edit Product" : "New Product"}</Text>
          <TextInput style={styles.input} placeholder="Product Name*" placeholderTextColor="#64748b" value={form.name} onChangeText={(t) => setForm({ ...form, name: t })} />
          <TextInput style={[styles.input, styles.textArea]} placeholder="Description" placeholderTextColor="#64748b" multiline numberOfLines={3} value={form.description} onChangeText={(t) => setForm({ ...form, description: t })} />
          <TextInput style={styles.input} placeholder="SKU" placeholderTextColor="#64748b" value={form.sku} onChangeText={(t) => setForm({ ...form, sku: t })} />
          <TextInput style={styles.input} placeholder="Barcode" placeholderTextColor="#64748b" value={form.barcode} onChangeText={(t) => setForm({ ...form, barcode: t })} />
          <TextInput style={styles.input} placeholder="Base Price*" placeholderTextColor="#64748b" keyboardType="decimal-pad" value={form.base_price} onChangeText={(t) => setForm({ ...form, base_price: t })} />
          <TextInput style={styles.input} placeholder="Sale Price (optional)" placeholderTextColor="#64748b" keyboardType="decimal-pad" value={form.sale_price} onChangeText={(t) => setForm({ ...form, sale_price: t })} />
          <TextInput style={styles.input} placeholder="Cost Price" placeholderTextColor="#64748b" keyboardType="decimal-pad" value={form.cost_price} onChangeText={(t) => setForm({ ...form, cost_price: t })} />
          <TextInput style={styles.input} placeholder="Stock Quantity" placeholderTextColor="#64748b" keyboardType="number-pad" value={form.stock_quantity} onChangeText={(t) => setForm({ ...form, stock_quantity: t })} />
          <TextInput style={styles.input} placeholder="Alert Level" placeholderTextColor="#64748b" keyboardType="number-pad" value={form.stock_alert_level} onChangeText={(t) => setForm({ ...form, stock_alert_level: t })} />
          <View style={styles.toggleRow}>
            <TouchableOpacity style={[styles.toggle, form.is_active && styles.toggleActive]} onPress={() => setForm({ ...form, is_active: !form.is_active })}>
              <Text style={styles.toggleText}>{form.is_active ? "✓ Active" : "Inactive"}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.toggle, form.track_inventory && styles.toggleActive]} onPress={() => setForm({ ...form, track_inventory: !form.track_inventory })}>
              <Text style={styles.toggleText}>{form.track_inventory ? "✓ Track Stock" : "No Tracking"}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveBtnText}>{editingProduct ? "Update" : "Create"}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, borderBottomWidth: 1, borderBottomColor: "#1e293b" },
  title: { color: "#f8fafc", fontSize: 20, fontWeight: "700" },
  addBtn: { backgroundColor: "#22c55e", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  addBtnText: { color: "#fff", fontWeight: "600" },
  searchInput: { backgroundColor: "#1e293b", color: "#f8fafc", margin: 12, padding: 12, borderRadius: 8, fontSize: 16 },
  list: { padding: 12 },
  productCard: { flexDirection: "row", backgroundColor: "#1e293b", borderRadius: 12, marginBottom: 12, padding: 12, alignItems: "center" },
  productImageContainer: { position: "relative", marginRight: 12 },
  productImage: { width: 64, height: 64, borderRadius: 8 },
  productImagePlaceholder: { width: 64, height: 64, borderRadius: 8, backgroundColor: "#334155", alignItems: "center", justifyContent: "center" },
  placeholderText: { fontSize: 24 },
  inactiveBadge: { position: "absolute", top: -4, left: -4, backgroundColor: "#ef4444", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  inactiveText: { color: "#fff", fontSize: 10, fontWeight: "600" },
  lowStockBadge: { position: "absolute", bottom: -4, right: -4, backgroundColor: "#f59e0b", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  lowStockText: { color: "#0f172a", fontSize: 10, fontWeight: "600" },
  productInfo: { flex: 1 },
  productName: { color: "#f8fafc", fontSize: 16, fontWeight: "600" },
  productSku: { color: "#64748b", fontSize: 12, marginTop: 2 },
  priceRow: { flexDirection: "row", alignItems: "center", marginTop: 4, gap: 8 },
  salePrice: { color: "#22c55e", fontSize: 16, fontWeight: "700" },
  basePrice: { color: "#64748b", fontSize: 14, textDecorationLine: "line-through" },
  stockText: { color: "#94a3b8", fontSize: 12, marginTop: 2 },
  deleteBtn: { padding: 8 },
  deleteBtnText: { fontSize: 20 },
  empty: { color: "#64748b", textAlign: "center", marginTop: 40 },
  modalContainer: { flex: 1, backgroundColor: "#0f172a", padding: 20 },
  modalTitle: { color: "#f8fafc", fontSize: 24, fontWeight: "700", marginBottom: 20 },
  input: { backgroundColor: "#1e293b", color: "#f8fafc", padding: 14, borderRadius: 10, marginBottom: 12, fontSize: 16 },
  textArea: { height: 80, textAlignVertical: "top" },
  toggleRow: { flexDirection: "row", gap: 12, marginBottom: 20 },
  toggle: { flex: 1, backgroundColor: "#334155", padding: 12, borderRadius: 10, alignItems: "center" },
  toggleActive: { backgroundColor: "#22c55e" },
  toggleText: { color: "#f8fafc", fontWeight: "600" },
  modalActions: { flexDirection: "row", gap: 12, marginTop: 20, marginBottom: 40 },
  saveBtn: { flex: 1, backgroundColor: "#3b82f6", padding: 16, borderRadius: 12, alignItems: "center" },
  saveBtnText: { color: "#fff", fontSize: 18, fontWeight: "700" },
  cancelBtn: { flex: 1, backgroundColor: "#334155", padding: 16, borderRadius: 12, alignItems: "center" },
  cancelBtnText: { color: "#94a3b8", fontSize: 18, fontWeight: "600" },
});
