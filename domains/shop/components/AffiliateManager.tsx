import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ScrollView } from 'react-native';
import { AffiliateService } from '../services/affiliateService';
import { ShopAffiliate } from '../types';

interface Props {
  shopId: string;
}

export default function AffiliateManager({ shopId }: Props) {
  const [program, setProgram] = useState<any>(null);
  const [affiliates, setAffiliates] = useState<ShopAffiliate[]>([]);
  const [stats, setStats] = useState({ clicks: 0, conversions: 0, earnings: 0 });
  const [loading, setLoading] = useState(true);
  const [commissionRate, setCommissionRate] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [prog, affs] = await Promise.all([
          AffiliateService.getProgram(shopId),
          AffiliateService.getMyAffiliates()
        ]);
        setProgram(prog);
        setAffiliates(affs);
        if (affs.length > 0) {
          const s = await AffiliateService.getAffiliateStats(affs[0].id);
          setStats(s);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [shopId]);

  const handleUpdateProgram = async () => {
    await AffiliateService.updateProgram(shopId, { commission_rate: parseFloat(commissionRate) });
  };

  const handleCreateProgram = async () => {
    await AffiliateService.createProgram({ shop_id: shopId, commission_rate: parseFloat(commissionRate) || 10 });
  };

  const handleJoin = async () => {
    await AffiliateService.joinAffiliateProgram(shopId);
  };

  if (loading) return <Text>Loading...</Text>;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Affiliate Manager</Text>
      {program ? (
        <View style={styles.card}>
          <Text>Commission: {program.commission_rate}%</Text>
          <Text>Min Payout: ${program.min_payout_amount || 0}</Text>
          <Text>Method: {program.payout_method || 'N/A'}</Text>
        </View>
      ) : (
        <Text>No affiliate program set up</Text>
      )}
      <TextInput style={styles.input} placeholder="Commission Rate %" value={commissionRate} onChangeText={setCommissionRate} keyboardType="numeric" />
      <Button title={program ? "Update Program" : "Create Program"} onPress={program ? handleUpdateProgram : handleCreateProgram} />
      <Button title="Join as Affiliate" onPress={handleJoin} />
      <Text style={styles.section}>My Affiliates ({affiliates.length})</Text>
      {affiliates.map((a: ShopAffiliate) => (
        <View key={a.id} style={styles.row}>
          <Text>{a.affiliate_id || a.id}</Text>
          <Text>${a.balance?.toFixed(2) || '0.00'}</Text>
        </View>
      ))}
      <View style={styles.card}>
        <Text>Stats: {stats.clicks} clicks, {stats.conversions} conversions, ${stats.earnings} earned</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  card: { backgroundColor: '#f5f5f5', padding: 12, borderRadius: 8, marginVertical: 8 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 8, borderRadius: 4, marginVertical: 8 },
  section: { fontSize: 16, fontWeight: '600', marginTop: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }
});
