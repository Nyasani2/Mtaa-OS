import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, Modal, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Users, Plus, Search, UserCheck, UserX, Mail, Building2, X, CheckCircle2, AlertCircle, Globe } from 'lucide-react-native';
import { useHealthRole } from '@/lib/health/hooks';
import { healthRoleService, ROLE_DISPLAY_NAMES, ROLE_COLORS } from '@/lib/health/services';
import type { HealthRole } from '@/lib/health/services';

const STATUS_FILTERS = ['All', 'Active', 'Pending', 'Suspended'];
const ROLE_FILTERS: HealthRole[] = ['doctor','nurse','pharmacist','lab_technician','radiologist','hospital_admin','cashier','hr_manager','accountant','ambulance_driver','receptionist','system_admin'];

export default function StaffManagementScreen() {
  const router = useRouter();
  const { staffRecord, facilityId, isSystemAdmin, role } = useHealthRole();
  const [staff, setStaff] = useState<any[]>([]);
  const [stats, setStats] = useState({ active: 0, pending: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All');
  const [roleFilter, setRoleFilter] = useState<string>('All Roles');
  const [searchQuery, setSearchQuery] = useState('');
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<HealthRole>('doctor');
  const [inviteDept, setInviteDept] = useState('');

  const canViewStaff = isSystemAdmin || !!facilityId;
  const viewScope = isSystemAdmin ? 'global' : 'facility';

  const fetchStaff = useCallback(async () => {
    if (!canViewStaff) { setStaff([]); setStats({ active: 0, pending: 0, total: 0 }); setLoading(false); return; }
    setLoading(true);
    try {
      const filters = { status: statusFilter === 'All' ? undefined : statusFilter, role: roleFilter === 'All Roles' ? undefined : roleFilter, search: searchQuery || undefined };
      let data: any[] = []; let staffStats = { active: 0, pending: 0, total: 0 };
      if (isSystemAdmin) { data = await healthRoleService.getAllStaffForSystemAdmin(filters); staffStats = await healthRoleService.getStaffStats(null); }
      else if (facilityId) { data = await healthRoleService.getStaffByFacility(facilityId, filters); staffStats = await healthRoleService.getStaffStats(facilityId); }
      setStaff(data); setStats(staffStats);
    } catch (err: any) { console.error('[StaffManagement] fetch error:', err); }
    finally { setLoading(false); setRefreshing(false); }
  }, [canViewStaff, isSystemAdmin, facilityId, statusFilter, roleFilter, searchQuery]);

  useEffect(() => { fetchStaff(); }, [fetchStaff]);
  const onRefresh = useCallback(() => { setRefreshing(true); fetchStaff(); }, [fetchStaff]);

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    try { await healthRoleService.inviteStaff({ email: inviteEmail, role: inviteRole, department: inviteDept || undefined, facilityId: isSystemAdmin ? undefined : facilityId || undefined }); setShowInvite(false); setInviteEmail(''); setInviteDept(''); fetchStaff(); }
    catch (err: any) { alert('Invite failed: ' + err.message); }
  };
  const handleApprove = async (staffId: string) => { try { await healthRoleService.approveStaff(staffId); fetchStaff(); } catch (err: any) { alert('Approve failed: ' + err.message); } };
  const handleSuspend = async (staffId: string) => { try { await healthRoleService.suspendStaff(staffId); fetchStaff(); } catch (err: any) { alert('Suspend failed: ' + err.message); } };

  const filteredStaff = staff.filter((s) => { const ms = statusFilter === 'All' || s.status === statusFilter; const mr = roleFilter === 'All Roles' || s.role === roleFilter; const msearch = !searchQuery || (s.user_full_name||'').toLowerCase().includes(searchQuery.toLowerCase()) || (s.user_email||'').toLowerCase().includes(searchQuery.toLowerCase()) || (s.facility_name||'').toLowerCase().includes(searchQuery.toLowerCase()); return ms && mr && msearch; });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><ArrowLeft size={24} color="#1f2937" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Staff Management</Text>
        {isSystemAdmin && <View style={styles.adminBadge}><Globe size={14} color="#fff" /><Text style={styles.adminBadgeText}>Global</Text></View>}
      </View>
      {isSystemAdmin && <View style={styles.scopeBanner}><Globe size={16} color="#2563eb" /><Text style={styles.scopeText}>System Admin View — All Facilities</Text></View>}
      <View style={styles.statsRow}>
        <View style={[styles.statCard,{backgroundColor:'#dcfce7'}]}><UserCheck size={20} color="#16a34a" /><Text style={[styles.statNumber,{color:'#16a34a'}]}>{stats.active}</Text><Text style={styles.statLabel}>Active</Text></View>
        <View style={[styles.statCard,{backgroundColor:'#fef9c3'}]}><AlertCircle size={20} color="#ca8a04" /><Text style={[styles.statNumber,{color:'#ca8a04'}]}>{stats.pending}</Text><Text style={styles.statLabel}>Pending</Text></View>
        <View style={[styles.statCard,{backgroundColor:'#e0e7ff'}]}><Users size={20} color="#4f46e5" /><Text style={[styles.statNumber,{color:'#4f46e5'}]}>{stats.total}</Text><Text style={styles.statLabel}>Total</Text></View>
      </View>
      <View style={styles.filterSection}>
        <View style={styles.searchBox}><Search size={18} color="#9ca3af" /><TextInput style={styles.searchInput} placeholder="Search staff..." value={searchQuery} onChangeText={setSearchQuery} placeholderTextColor="#9ca3af" />{searchQuery.length>0 && <TouchableOpacity onPress={()=>setSearchQuery('')}><X size={16} color="#9ca3af" /></TouchableOpacity>}</View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          {STATUS_FILTERS.map((s)=>(<TouchableOpacity key={s} style={[styles.filterChip,statusFilter===s&&styles.filterChipActive]} onPress={()=>setStatusFilter(s)}><Text style={[styles.filterChipText,statusFilter===s&&styles.filterChipTextActive]}>{s}</Text></TouchableOpacity>))}
        </ScrollView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          <TouchableOpacity style={[styles.filterChip,roleFilter==='All Roles'&&styles.filterChipActive]} onPress={()=>setRoleFilter('All Roles')}><Text style={[styles.filterChipText,roleFilter==='All Roles'&&styles.filterChipTextActive]}>All Roles</Text></TouchableOpacity>
          {ROLE_FILTERS.map((r)=>(<TouchableOpacity key={r} style={[styles.filterChip,roleFilter===r&&styles.filterChipActive]} onPress={()=>setRoleFilter(r)}><Text style={[styles.filterChipText,roleFilter===r&&styles.filterChipTextActive]}>{ROLE_DISPLAY_NAMES[r]}</Text></TouchableOpacity>))}
        </ScrollView>
      </View>
      {canViewStaff && <TouchableOpacity style={styles.inviteBtn} onPress={()=>setShowInvite(true)}><Plus size={18} color="#fff" /><Text style={styles.inviteBtnText}>Invite Staff</Text></TouchableOpacity>}
      <ScrollView style={styles.list} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh}/>}>
        {loading&&!refreshing?<ActivityIndicator size="large" color="#2563eb" style={{marginTop:40}}/>:filteredStaff.length===0?(
          <View style={styles.emptyState}><Users size={48} color="#d1d5db" /><Text style={styles.emptyTitle}>No Staff Found</Text><Text style={styles.emptySubtitle}>{canViewStaff?'Try adjusting your filters or invite new staff.':'No facility assigned. Contact a system administrator.'}</Text></View>
        ):filteredStaff.map((s)=>(
          <View key={s.id} style={styles.staffCard}>
            <View style={styles.staffHeader}>
              <View style={[styles.roleBadge,{backgroundColor:(ROLE_COLORS[s.role as HealthRole]||'#6b7280')+'20'}]}><Text style={[styles.roleBadgeText,{color:ROLE_COLORS[s.role as HealthRole]||'#6b7280'}]}>{ROLE_DISPLAY_NAMES[s.role as HealthRole]||s.role}</Text></View>
              <View style={[styles.statusBadge,{backgroundColor:s.status==='active'?'#dcfce7':s.status==='pending'?'#fef9c3':'#fee2e2'}]}><Text style={{color:s.status==='active'?'#16a34a':s.status==='pending'?'#ca8a04':'#dc2626',fontSize:11,fontWeight:'600',textTransform:'capitalize'}}>{s.status}</Text></View>
            </View>
            <Text style={styles.staffName}>{s.user_full_name||s.user_email||'Unknown'}</Text>
            {s.user_email&&s.user_email!==s.user_full_name&&<Text style={styles.staffEmail}>{s.user_email}</Text>}
            {isSystemAdmin&&s.facility_name&&<View style={styles.facilityRow}><Building2 size={14} color="#6b7280" /><Text style={styles.facilityText}>{s.facility_name}</Text></View>}
            {s.department&&<Text style={styles.staffMeta}>Dept: {s.department}</Text>}
            <View style={styles.staffActions}>
              {s.status==='pending'&&<TouchableOpacity style={[styles.actionBtn,{backgroundColor:'#dcfce7'}]} onPress={()=>handleApprove(s.id)}><CheckCircle2 size={16} color="#16a34a" /><Text style={[styles.actionBtnText,{color:'#16a34a'}]}>Approve</Text></TouchableOpacity>}
              {s.status==='active'&&<TouchableOpacity style={[styles.actionBtn,{backgroundColor:'#fee2e2'}]} onPress={()=>handleSuspend(s.id)}><UserX size={16} color="#dc2626" /><Text style={[styles.actionBtnText,{color:'#dc2626'}]}>Suspend</Text></TouchableOpacity>}
            </View>
          </View>
        ))}
      </ScrollView>
      <Modal visible={showInvite} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}><Text style={styles.modalTitle}>Invite Staff Member</Text><TouchableOpacity onPress={()=>setShowInvite(false)}><X size={24} color="#6b7280"/></TouchableOpacity></View>
            <Text style={styles.modalLabel}>Email</Text>
            <TextInput style={styles.modalInput} placeholder="staff@hospital.com" value={inviteEmail} onChangeText={setInviteEmail} keyboardType="email-address" autoCapitalize="none" placeholderTextColor="#9ca3af"/>
            <Text style={styles.modalLabel}>Role</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.roleSelector}>
              {ROLE_FILTERS.map((r)=>(<TouchableOpacity key={r} style={[styles.roleChip,inviteRole===r&&styles.roleChipActive]} onPress={()=>setInviteRole(r)}><Text style={[styles.roleChipText,inviteRole===r&&styles.roleChipTextActive]}>{ROLE_DISPLAY_NAMES[r]}</Text></TouchableOpacity>))}
            </ScrollView>
            <Text style={styles.modalLabel}>Department (optional)</Text>
            <TextInput style={styles.modalInput} placeholder="e.g. Cardiology" value={inviteDept} onChangeText={setInviteDept} placeholderTextColor="#9ca3af"/>
            <TouchableOpacity style={styles.modalSubmit} onPress={handleInvite}><Mail size={18} color="#fff"/><Text style={styles.modalSubmitText}>Send Invitation</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container:{flex:1,backgroundColor:'#f8fafc'},
  header:{flexDirection:'row',alignItems:'center',paddingHorizontal:16,paddingTop:16,paddingBottom:12,backgroundColor:'#fff',borderBottomWidth:1,borderBottomColor:'#e5e7eb'},
  backBtn:{padding:4,marginRight:12},
  headerTitle:{fontSize:20,fontWeight:'700',color:'#1f2937',flex:1},
  adminBadge:{flexDirection:'row',alignItems:'center',backgroundColor:'#dc2626',paddingHorizontal:10,paddingVertical:4,borderRadius:12,gap:4},
  adminBadgeText:{color:'#fff',fontSize:11,fontWeight:'700'},
  scopeBanner:{flexDirection:'row',alignItems:'center',backgroundColor:'#eff6ff',paddingHorizontal:16,paddingVertical:10,gap:8,borderBottomWidth:1,borderBottomColor:'#dbeafe'},
  scopeText:{color:'#2563eb',fontSize:13,fontWeight:'600'},
  statsRow:{flexDirection:'row',paddingHorizontal:16,paddingVertical:12,gap:10},
  statCard:{flex:1,alignItems:'center',paddingVertical:14,borderRadius:12,gap:4},
  statNumber:{fontSize:22,fontWeight:'800'},
  statLabel:{fontSize:11,color:'#6b7280',fontWeight:'600'},
  filterSection:{paddingHorizontal:16,paddingBottom:8},
  searchBox:{flexDirection:'row',alignItems:'center',backgroundColor:'#fff',borderRadius:10,paddingHorizontal:12,paddingVertical:10,borderWidth:1,borderColor:'#e5e7eb',gap:8,marginBottom:10},
  searchInput:{flex:1,fontSize:15,color:'#1f2937'},
  filterRow:{marginBottom:8},
  filterChip:{paddingHorizontal:14,paddingVertical:6,borderRadius:20,backgroundColor:'#fff',borderWidth:1,borderColor:'#e5e7eb',marginRight:8},
  filterChipActive:{backgroundColor:'#2563eb',borderColor:'#2563eb'},
  filterChipText:{fontSize:12,color:'#6b7280',fontWeight:'600'},
  filterChipTextActive:{color:'#fff'},
  inviteBtn:{flexDirection:'row',alignItems:'center',justifyContent:'center',backgroundColor:'#2563eb',marginHorizontal:16,paddingVertical:12,borderRadius:10,gap:8,marginBottom:8},
  inviteBtnText:{color:'#fff',fontSize:15,fontWeight:'700'},
  list:{flex:1,paddingHorizontal:16},
  emptyState:{alignItems:'center',marginTop:60,paddingHorizontal:24},
  emptyTitle:{fontSize:18,fontWeight:'700',color:'#6b7280',marginTop:16},
  emptySubtitle:{fontSize:14,color:'#9ca3af',marginTop:6,textAlign:'center'},
  staffCard:{backgroundColor:'#fff',borderRadius:12,padding:14,marginBottom:10,borderWidth:1,borderColor:'#e5e7eb'},
  staffHeader:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:8},
  roleBadge:{paddingHorizontal:10,paddingVertical:4,borderRadius:8},
  roleBadgeText:{fontSize:11,fontWeight:'700'},
  statusBadge:{paddingHorizontal:8,paddingVertical:3,borderRadius:6},
  staffName:{fontSize:16,fontWeight:'700',color:'#1f2937'},
  staffEmail:{fontSize:13,color:'#6b7280',marginTop:2},
  facilityRow:{flexDirection:'row',alignItems:'center',gap:4,marginTop:6},
  facilityText:{fontSize:12,color:'#6b7280'},
  staffMeta:{fontSize:12,color:'#9ca3af',marginTop:4},
  staffActions:{flexDirection:'row',gap:8,marginTop:10},
  actionBtn:{flexDirection:'row',alignItems:'center',paddingHorizontal:12,paddingVertical:6,borderRadius:8,gap:6},
  actionBtnText:{fontSize:12,fontWeight:'600'},
  modalOverlay:{flex:1,backgroundColor:'rgba(0,0,0,0.5)',justifyContent:'flex-end'},
  modalContent:{backgroundColor:'#fff',borderTopLeftRadius:20,borderTopRightRadius:20,padding:20,paddingBottom:40},
  modalHeader:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:16},
  modalTitle:{fontSize:18,fontWeight:'700',color:'#1f2937'},
  modalLabel:{fontSize:13,fontWeight:'600',color:'#6b7280',marginBottom:6,marginTop:12},
  modalInput:{borderWidth:1,borderColor:'#e5e7eb',borderRadius:10,paddingHorizontal:12,paddingVertical:10,fontSize:15,color:'#1f2937'},
  roleSelector:{marginTop:4},
  roleChip:{paddingHorizontal:14,paddingVertical:8,borderRadius:20,backgroundColor:'#f3f4f6',marginRight:8},
  roleChipActive:{backgroundColor:'#2563eb'},
  roleChipText:{fontSize:12,color:'#6b7280',fontWeight:'600'},
  roleChipTextActive:{color:'#fff'},
  modalSubmit:{flexDirection:'row',alignItems:'center',justifyContent:'center',backgroundColor:'#2563eb',paddingVertical:14,borderRadius:12,gap:8,marginTop:20},
  modalSubmitText:{color:'#fff',fontSize:15,fontWeight:'700'},
});
