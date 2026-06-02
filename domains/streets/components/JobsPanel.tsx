import React from 'react';
import { View, Text, Pressable, FlatList, StyleSheet } from 'react-native';
import { useJobs } from '../hooks/useJobs';

export function JobsPanel() {
  const { jobs, myApplications, myListings, apply, postJob } = useJobs();
  const [tab, setTab] = React.useState<'browse' | 'applied' | 'posted'>('browse');

  const renderJob = ({ item }: { item: any }) => (
    <View style={styles.jobCard}>
      <Text style={styles.jobTitle}>{item.title}</Text>
      <Text style={styles.jobCompany}>{item.company} • {item.location}</Text>
      <Text style={styles.jobSalary}>{item.salary}</Text>
      <Text style={styles.jobType}>{item.type}</Text>
      <Pressable style={styles.applyBtn} onPress={() => apply.mutate({ jobId: item.id, coverLetter: '' })}>
        <Text style={styles.applyText}>Apply Now</Text>
      </Pressable>
    </View>
  );

  const data = tab === 'browse' ? jobs : tab === 'applied' ? myApplications : myListings;

  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        <Pressable style={[styles.tab, tab === 'browse' && styles.activeTab]} onPress={() => setTab('browse')}>
          <Text style={[styles.tabText, tab === 'browse' && styles.activeTabText]}>Browse</Text>
        </Pressable>
        <Pressable style={[styles.tab, tab === 'applied' && styles.activeTab]} onPress={() => setTab('applied')}>
          <Text style={[styles.tabText, tab === 'applied' && styles.activeTabText]}>Applied</Text>
        </Pressable>
        <Pressable style={[styles.tab, tab === 'posted' && styles.activeTab]} onPress={() => setTab('posted')}>
          <Text style={[styles.tabText, tab === 'posted' && styles.activeTabText]}>Posted</Text>
        </Pressable>
      </View>
      <FlatList data={data} renderItem={renderJob} keyExtractor={item => item.id} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#eee' },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  activeTab: { borderBottomWidth: 2, borderBottomColor: '#E91E63' },
  tabText: { fontSize: 14, color: '#888' },
  activeTabText: { color: '#E91E63', fontWeight: '700' },
  jobCard: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  jobTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  jobCompany: { fontSize: 13, color: '#666', marginBottom: 4 },
  jobSalary: { fontSize: 14, color: '#4CAF50', fontWeight: '600', marginBottom: 4 },
  jobType: { fontSize: 12, color: '#888', marginBottom: 12 },
  applyBtn: { backgroundColor: '#E91E63', padding: 10, borderRadius: 8, alignItems: 'center', alignSelf: 'flex-start' },
  applyText: { color: '#fff', fontWeight: '700' },
});
