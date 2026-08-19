// @ts-nocheck
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useStay } from "@/domains/stay/hooks/useStay";
import { HostInfoCard, ReviewList, AmenityBadge } from "@/domains/stay/components";
import { Heart, Share2, MapPin, Star, Users, Bed, Bath, Wifi, ChevronLeft, Calendar, ShieldCheck } from "lucide-react-native";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/auth/store/auth.store";
import { supabase } from "@/lib/supabase";
import * as StreetsService from "@/lib/services/streets-service";

export default function StayDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { fetchListing, toggleSaved, savedIds } = useStay();
  const [listing, setListing] = useState(null);
  const { user } = useAuthStore();
  const [boostMsg, setBoostMsg] = useState(null);

  useEffect(() => {
    if (id) fetchListing(id as string).then((d) => setListing(d));
  }, [id, fetchListing]);

  if (!listing) return <View style={styles.center}><Text>Stay not found</Text></View>;

  const boostStay = async () => {
    try {
      const { data: wbal } = await supabase.from('wallet_accounts').select('balance').eq('user_id', user.id).maybeSingle();
      const bal = Number(wbal?.balance || 0);
      if (bal < 200) { setBoostMsg('❌ Insufficient wallet balance (KES ' + bal + '). Top up first — boost costs KES 200.'); return; }
      const { error: de } = await supabase.rpc('wallet_debit', { _user_id: user.id, _amount: 200, _reference: 'Boost stay to Streets' });
      if (de) { setBoostMsg('Boost failed: ' + de.message); return; }
      const until = new Date(Date.now() + 7 * 86400000).toISOString();
      await supabase.from('properties').update({ boosted_until: until, boost_cost: (Number(listing.boost_cost) || 0) + 200 }).eq('id', listing.id);
      const marker = '[stayboost:' + listing.id + ']';
      const { data: dup } = await supabase.from('streets_posts').select('id').ilike('content', '%' + marker + '%').limit(1);
      if (!dup || !dup.length) {
        await StreetsService.createPost({
          creatorId: user.id,
          content: marker + ' ⚡ Sponsored Stay: ' + listing.title + ' in ' + listing.town + ' — KES ' + Number(listing.price_per_night || 0).toLocaleString() + '/night. Open the Stay app to book!',
          caption: listing.title + ' · ' + listing.town + ' · KES ' + Number(listing.price_per_night || 0).toLocaleString() + '/night',
          mediaUrl: listing.cover_image || null,
          mediaType: 'image',
          hashtags: ['sponsored', 'stay', 'mtaa', 'deal'],
          isPublic: true,
        });
      }
      setBoostMsg('⚡ Boosted! Your stay is live on Streets for 7 days.');
    } catch (e) { setBoostMsg('Boost error: ' + String(e)); }
  };

  const saved = savedIds.includes(listing.id);
  const price = listing.price_per_night || 0;
  const currency = listing.currency || 'KES';

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero Image */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: listing.cover_image || 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==' }} style={styles.heroImage} />
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <ChevronLeft size={24} color="#1a1a1a" />
          </TouchableOpacity>
          <View style={styles.topActions}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => toggleSaved(listing.id)}>
              <Heart size={20} color={saved ? "#ef4444" : "#1a1a1a"} fill={saved ? "#ef4444" : "none"} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn}>
              <Share2 size={20} color="#1a1a1a" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.info}>
          {/* Title & Rating */}
          <View style={styles.headerRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{listing.listing_type?.replace('_', ' ')}</Text>
            </View>
            <View style={styles.rating}>
              <Star size={14} color="#f59e0b" fill="#f59e0b" />
              <Text style={styles.ratingText}>{listing.average_rating || "New"}</Text>
              <Text style={styles.reviewCount}>({listing.review_count || 0} reviews)</Text>
            </View>
          </View>

          <Text style={styles.title}>{listing.title}</Text>
          <View style={styles.locationRow}>
            <MapPin size={16} color="#6b7280" />
            <Text style={styles.location}>{listing.town}, {listing.country}</Text>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Host */}
          <HostInfoCard host={{ name: listing.owner_id, superhost_status: false, government_id_verified: true, response_rate: 95 }} />

          {/* Divider */}
          <View style={styles.divider} />

          {/* Amenities */}
          <Text style={styles.sectionTitle}>What this place offers</Text>
          <View style={styles.amenities}>
            {listing.amenities?.map((a: string, i: number) => (
              <AmenityBadge key={i} name={a} />
            ))}
            {!listing.amenities?.length && (
              <Text style={styles.emptyText}>No amenities listed</Text>
            )}
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* About */}
          <Text style={styles.sectionTitle}>About this place</Text>
          <Text style={styles.description}>{listing.description || 'No description provided.'}</Text>

          {/* Divider */}
          <View style={styles.divider} />

          {/* House Rules */}
          {listing.house_rules?.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>House Rules</Text>
              {listing.house_rules.map((rule: string, i: number) => (
                <Text key={i} style={styles.ruleText}>• {rule}</Text>
              ))}
              <View style={styles.divider} />
            </>
          )}

          {/* Reviews */}
          <ReviewList reviews={[]} />

          {listing.owner_id === user?.id ? (
            <View style={{ marginTop: 20 }}>
              {listing.boosted_until && new Date(listing.boosted_until) > new Date() ? (
                <View style={{ backgroundColor: '#e8f5e9', borderRadius: 12, padding: 14 }}>
                  <Text style={{ color: '#1a5c4b', fontWeight: '700' }}>✓ Boosted on Streets until {new Date(listing.boosted_until).toLocaleDateString()}</Text>
                </View>
              ) : (
                <TouchableOpacity onPress={boostStay} style={{ backgroundColor: '#f5a623', borderRadius: 12, paddingVertical: 14, alignItems: 'center' }}>
                  <Text style={{ color: '#fff', fontSize: 15, fontWeight: '800' }}>⚡ Boost to Streets (200 KES)</Text>
                </TouchableOpacity>
              )}
              {boostMsg ? <Text style={{ color: '#1a5c4b', marginTop: 8, textAlign: 'center', fontWeight: '600' }}>{boostMsg}</Text> : null}
            </View>
          ) : null}
        </View>
      </ScrollView>

      {/* Sticky Bottom CTA — Airbnb Style */}
      <View style={styles.bottomBar}>
        <View>
          <Text style={styles.price}>{currency} {price.toLocaleString()}</Text>
          <Text style={styles.priceUnit}>per night</Text>
        </View>
        <TouchableOpacity
          style={styles.bookBtn}
          onPress={() => router.push({ pathname: "/(os)/stay/booking", params: { id: listing.id } })}
        >
          <Calendar size={18} color="#fff" />
          <Text style={styles.bookBtnText}>Book Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f6f1" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  imageContainer: { position: "relative", height: 320 },
  heroImage: { width: "100%", height: "100%" },
  backBtn: { position: "absolute", top: 60, left: 16, width: 40, height: 40, borderRadius: 20, backgroundColor: "#fff", alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  topActions: { position: "absolute", top: 60, right: 16, flexDirection: "row", gap: 8 },
  actionBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#fff", alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  info: { padding: 20 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  badge: { backgroundColor: "#1a5c4b", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { color: "#fff", fontSize: 12, fontWeight: "600", textTransform: "capitalize" },
  rating: { flexDirection: "row", alignItems: "center", gap: 4 },
  ratingText: { fontSize: 14, fontWeight: "600", color: "#1a1a1a" },
  reviewCount: { fontSize: 13, color: "#6b7280" },
  title: { fontSize: 26, fontWeight: "700", color: "#1a1a1a", marginBottom: 8 },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 16 },
  location: { fontSize: 15, color: "#6b7280" },
  divider: { height: 1, backgroundColor: "#e5e0d5", marginVertical: 20 },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#1a1a1a", marginBottom: 12 },
  description: { fontSize: 15, color: "#4b5563", lineHeight: 22 },
  amenities: { flexDirection: "row", flexWrap: "wrap" },
  emptyText: { fontSize: 14, color: "#9ca3af" },
  ruleText: { fontSize: 14, color: "#4b5563", marginBottom: 6 },
  bottomBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, paddingBottom: 32, backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#e5e0d5" },
  price: { fontSize: 20, fontWeight: "700", color: "#1a1a1a" },
  priceUnit: { fontSize: 13, color: "#6b7280" },
  bookBtn: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#1a5c4b", paddingHorizontal: 28, paddingVertical: 14, borderRadius: 12 },
  bookBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
