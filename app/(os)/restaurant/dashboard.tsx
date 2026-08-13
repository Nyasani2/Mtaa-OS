// @ts-nocheck
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useDashboardAutoRefresh, useTableStatus, useKds, useInventory, useRestaurantManager } from '@/lib/restaurant/hooks';

const { width } = Dimensions.get('window');

export default function RestaurantDashboard() {
  const router = useRouter();
  const { metrics, isLoading: metricsLoading } = useDashboardAutoRefresh();
  const { statusCounts, refresh: refreshTables } = useTableStatus();
  const { tickets, loadTickets } = useKds();
  const { alerts: lowStockAlerts = [] } = useInventory();
  const manager = useRestaurantManager();
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = async () => { setRefreshing(true); await manager.refreshAll(); setRefreshing(false); };
  const activeOrders = tickets?.filter((t: any) => t.status === 'pending' || t.status === 'cooking').length || 0;
  const delayedOrders = tickets?.filter((t: any) => t.priority === 'delayed').length || 0;

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh}/>}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Restaurant Command Centre</Text>
        <Text style={styles.headerSubtitle}>{new Date().toLocaleDateString()}</Text>
      </View>
      <View style={styles.kpiRow}>
        <KpiCard title="Today's Sales" value={metrics?`KSh ${metrics.total_sales?.toFixed(2)||'0.00'}`:'—'} subtitle={`${metrics?.total_orders||0} orders`} color="#10B981"/>
        <KpiCard title="Active Tables" value={`${statusCounts?.occupied||0}/${(statusCounts?.occupied||0)+(statusCounts?.available||0)}`} subtitle={`${statusCounts?.available||0} available`} color="#3B82F6"/>
      </View>
      <View style={styles.kpiRow}>
        <KpiCard title="Kitchen Queue" value={String(activeOrders)} subtitle={`${delayedOrders} delayed`} color={delayedOrders>0?"#EF4444":"#F59E0B"}/>
        <KpiCard title="Avg Ticket" value={metrics?`KSh ${metrics.average_ticket?.toFixed(2)||'0.00'}`:'—'} subtitle="per order" color="#8B5CF6"/>
      </View>
      {lowStockAlerts?.length>0 && (
        <View style={styles.alertSection}>
          <Text style={styles.alertTitle}>⚠️ Low Stock Alerts ({lowStockAlerts?.length})</Text>
          {lowStockAlerts?.slice(0,3).map((item)=>(<View key={item.id} style={styles.alertItem}><Text style={styles.alertText}>{item.name} — {item.current_quantity} / {item.reorder_level} {item.unit}</Text></View>))}
        </View>
      )}
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.actionGrid}>
        <ActionButton icon="🛒" label="New Order" route="/(os)/restaurant/pos" router={router}/>
        <ActionButton icon="📋" label="KDS" route="/(os)/restaurant/kds" router={router}/>
        <ActionButton icon="🪑" label="Tables" route="/(os)/restaurant/tables" router={router}/>
        <ActionButton icon="📦" label="Inventory" route="/(os)/restaurant/inventory" router={router}/>
        <ActionButton icon="👥" label="Staff" route="/(os)/restaurant/staff" router={router}/>
        <ActionButton icon="📊" label="Reports" route="/(os)/restaurant/reports" router={router}/>
      </View>
      <Text style={styles.sectionTitle}>Today's Summary</Text>
      <View style={styles.summaryCard}>
        <SummaryRow label="Total Revenue" value={`KSh ${metrics?.total_sales?.toFixed(2)||'0.00'}`}/>
        <SummaryRow label="Total Orders" value={String(metrics?.total_orders||0)}/>
        <SummaryRow label="Dine-in" value={String(metrics?.dine_in_orders||0)}/>
        <SummaryRow label="Takeaway" value={String(metrics?.takeaway_orders||0)}/>
        <SummaryRow label="Delivery" value={String(metrics?.delivery_orders||0)}/>
        <SummaryRow label="Refunds" value={`KSh ${metrics?.refunds?.toFixed(2)||'0.00'}`} color="#EF4444"/>
      </View>
    </ScrollView>
  );
}

function KpiCard({title,value,subtitle,color}:any){return(<View style={[styles.kpiCard,{borderLeftColor:color,borderLeftWidth:4}]}><Text style={styles.kpiTitle}>{title}</Text><Text style={[styles.kpiValue,{color}]}>{value}</Text><Text style={styles.kpiSubtitle}>{subtitle}</Text></View>);}
function ActionButton({icon,label,route,router}:any){return(<TouchableOpacity style={styles.actionButton} onPress={()=>router.push(route)}><Text style={styles.actionIcon}>{icon}</Text><Text style={styles.actionLabel}>{label}</Text></TouchableOpacity>);}
function SummaryRow({label,value,color='#1F2937'}:any){return(<View style={styles.summaryRow}><Text style={styles.summaryLabel}>{label}</Text><Text style={[styles.summaryValue,{color}]}>{value}</Text></View>);}

const styles = StyleSheet.create({
  container:{flex:1,backgroundColor:'#F3F4F6'},header:{padding:20,paddingTop:60,backgroundColor:'#1F2937'},headerTitle:{fontSize:24,fontWeight:'bold',color:'#FFFFFF'},headerSubtitle:{fontSize:14,color:'#9CA3AF',marginTop:4},kpiRow:{flexDirection:'row',paddingHorizontal:12,marginTop:12,gap:12},kpiCard:{flex:1,backgroundColor:'#FFFFFF',borderRadius:12,padding:16,shadowColor:'#000',shadowOffset:{width:0,height:2},shadowOpacity:0.1,shadowRadius:4,elevation:3},kpiTitle:{fontSize:12,color:'#6B7280',textTransform:'uppercase',letterSpacing:0.5},kpiValue:{fontSize:24,fontWeight:'bold',marginTop:4},kpiSubtitle:{fontSize:12,color:'#9CA3AF',marginTop:2},alertSection:{margin:12,backgroundColor:'#FEF3C7',borderRadius:12,padding:16,borderLeftWidth:4,borderLeftColor:'#F59E0B'},alertTitle:{fontSize:14,fontWeight:'600',color:'#92400E',marginBottom:8},alertItem:{paddingVertical:4},alertText:{fontSize:13,color:'#78350F'},sectionTitle:{fontSize:16,fontWeight:'600',color:'#1F2937',marginHorizontal:16,marginTop:20,marginBottom:12},actionGrid:{flexDirection:'row',flexWrap:'wrap',paddingHorizontal:12,gap:12},actionButton:{width:(width-48)/3,backgroundColor:'#FFFFFF',borderRadius:12,padding:16,alignItems:'center',shadowColor:'#000',shadowOffset:{width:0,height:1},shadowOpacity:0.05,shadowRadius:2,elevation:2},actionIcon:{fontSize:28},actionLabel:{fontSize:12,color:'#4B5563',marginTop:8,textAlign:'center'},summaryCard:{margin:12,backgroundColor:'#FFFFFF',borderRadius:12,padding:16,shadowColor:'#000',shadowOffset:{width:0,height:2},shadowOpacity:0.1,shadowRadius:4,elevation:3},summaryRow:{flexDirection:'row',justifyContent:'space-between',paddingVertical:10,borderBottomWidth:1,borderBottomColor:'#F3F4F6'},summaryLabel:{fontSize:14,color:'#6B7280'},summaryValue:{fontSize:14,fontWeight:'600'},
});
