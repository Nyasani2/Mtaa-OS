import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { AppItem } from '@/hooks/useAppStore';

interface Review {
  id: string;
  userName: string;
  avatar: string;
  rating: number;
  date: string;
  text: string;
  helpful: number;
  developerResponse?: string;
}

interface AppReviewsProps {
  app: AppItem;
  visible: boolean;
  onClose: () => void;
}

const MOCK_REVIEWS: Review[] = [
  {
    id: 'r1',
    userName: 'Sarah M.',
    avatar: 'user',
    rating: 5,
    date: '2 days ago',
    text: 'Absolutely love this app! The interface is so clean and the wallet integration makes payments seamless. Highly recommend to everyone.',
    helpful: 234,
  },
  {
    id: 'r2',
    userName: 'James K.',
    avatar: 'user',
    rating: 4,
    date: '1 week ago',
    text: 'Great app overall. Would love to see more customization options in the next update. The tracking feature is top-notch.',
    helpful: 156,
    developerResponse: 'Thanks for the feedback! Custom themes are coming in v2.5. Stay tuned!',
  },
  {
    id: 'r3',
    userName: 'Aisha B.',
    avatar: 'user',
    rating: 5,
    date: '2 weeks ago',
    text: 'Best app in its category. The ASIS AI integration is a game changer. I use this daily for work and personal tasks.',
    helpful: 89,
  },
  {
    id: 'r4',
    userName: 'David O.',
    avatar: 'user',
    rating: 3,
    date: '3 weeks ago',
    text: 'Good app but sometimes slow to load on older devices. Hope the performance improves soon.',
    helpful: 45,
    developerResponse: 'We are actively working on performance optimizations for older devices. Expect improvements in the next release.',
  },
  {
    id: 'r5',
    userName: 'Grace N.',
    avatar: 'user',
    rating: 5,
    date: '1 month ago',
    text: 'This is exactly what I needed! The community features are amazing and the support team is very responsive.',
    helpful: 312,
  },
];

export function AppReviews({ app, visible, onClose }: AppReviewsProps) {
  const [filter, setFilter] = useState<'all' | '5' | '4' | '3' | '2' | '1'>('all');
  const [showWriteReview, setShowWriteReview] = useState(false);
  const [newRating, setNewRating] = useState(0);
  const [newReviewText, setNewReviewText] = useState('');

  const filteredReviews = filter === 'all'
    ? MOCK_REVIEWS
    : MOCK_REVIEWS.filter(r => r.rating === parseInt(filter));

  const ratingCounts = {
    5: MOCK_REVIEWS.filter(r => r.rating === 5).length,
    4: MOCK_REVIEWS.filter(r => r.rating === 4).length,
    3: MOCK_REVIEWS.filter(r => r.rating === 3).length,
    2: MOCK_REVIEWS.filter(r => r.rating === 2).length,
    1: MOCK_REVIEWS.filter(r => r.rating === 1).length,
  };

  const totalReviews = MOCK_REVIEWS.length;
  const avgRating = app.rating;

  const renderStars = (rating: number, size: number = 14) => {
    return (
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map(star => (
          <Feather
            key={star}
            name={star <= rating ? 'star' : 'star'}
            size={size}
            color={star <= rating ? '#FFD700' : '#333'}
            style={{ marginRight: 2 }}
          />
        ))}
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Feather name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Reviews & Ratings</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Rating Summary */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryLeft}>
              <Text style={styles.avgRating}>{avgRating.toFixed(1)}</Text>
              {renderStars(Math.floor(avgRating), 18)}
              <Text style={styles.totalReviews}>{app.reviewCount.toLocaleString()} reviews</Text>
            </View>
            <View style={styles.summaryRight}>
              {[5, 4, 3, 2, 1].map(star => {
                const count = ratingCounts[star as keyof typeof ratingCounts];
                const percentage = (count / totalReviews) * 100;
                return (
                  <View key={star} style={styles.ratingBarRow}>
                    <Text style={styles.ratingBarLabel}>{star}</Text>
                    <Feather name="star" size={10} color="#666" />
                    <View style={styles.ratingBarBg}>
                      <View style={[styles.ratingBarFill, { width: `${percentage}%` }]} />
                    </View>
                    <Text style={styles.ratingBarCount}>{count}</Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Write Review Button */}
          <TouchableOpacity style={styles.writeReviewButton} onPress={() => setShowWriteReview(true)}>
            <Feather name="edit-3" size={18} color="#121212" />
            <Text style={styles.writeReviewText}>Write a Review</Text>
          </TouchableOpacity>

          {/* Filter Tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterScroll}
            contentContainerStyle={styles.filterContent}
          >
            {(['all', '5', '4', '3', '2', '1'] as const).map(f => (
              <TouchableOpacity
                key={f}
                style={[styles.filterTab, filter === f && styles.filterTabActive]}
                onPress={() => setFilter(f)}
              >
                <Text style={[styles.filterTabText, filter === f && styles.filterTabTextActive]}>
                  {f === 'all' ? 'All' : `${f}★`}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Reviews List */}
          <View style={styles.reviewsList}>
            {filteredReviews.map(review => (
              <View key={review.id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <View style={styles.avatar}>
                    <Feather name="user" size={16} color="#888" />
                  </View>
                  <View style={styles.reviewMeta}>
                    <Text style={styles.reviewerName}>{review.userName}</Text>
                    <View style={styles.reviewRatingRow}>
                      {renderStars(review.rating, 12)}
                      <Text style={styles.reviewDate}>{review.date}</Text>
                    </View>
                  </View>
                </View>
                <Text style={styles.reviewText}>{review.text}</Text>
                <View style={styles.reviewActions}>
                  <TouchableOpacity style={styles.helpfulButton}>
                    <Feather name="thumbs-up" size={14} color="#888" />
                    <Text style={styles.helpfulText}>Helpful ({review.helpful})</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.reportButton}>
                    <Feather name="flag" size={14} color="#666" />
                  </TouchableOpacity>
                </View>
                {review.developerResponse && (
                  <View style={styles.devResponse}>
                    <View style={styles.devResponseHeader}>
                      <Feather name="message-square" size={12} color="#4ECDC4" />
                      <Text style={styles.devResponseLabel}>Developer Response</Text>
                    </View>
                    <Text style={styles.devResponseText}>{review.developerResponse}</Text>
                  </View>
                )}
              </View>
            ))}
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>

        {/* Write Review Modal */}
        <Modal visible={showWriteReview} animationType="slide" transparent>
          <View style={styles.writeReviewOverlay}>
            <View style={styles.writeReviewCard}>
              <View style={styles.writeReviewHeader}>
                <Text style={styles.writeReviewTitle}>Write a Review</Text>
                <TouchableOpacity onPress={() => setShowWriteReview(false)}>
                  <Feather name="x" size={22} color="#fff" />
                </TouchableOpacity>
              </View>
              <Text style={styles.writeReviewAppName}>{app.name}</Text>
              <View style={styles.starPicker}>
                {[1, 2, 3, 4, 5].map(star => (
                  <TouchableOpacity key={star} onPress={() => setNewRating(star)}>
                    <Feather
                      name="star"
                      size={32}
                      color={star <= newRating ? '#FFD700' : '#333'}
                      style={{ marginHorizontal: 6 }}
                    />
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput
                style={styles.reviewInput}
                placeholder="Share your experience..."
                placeholderTextColor="#666"
                multiline
                numberOfLines={4}
                value={newReviewText}
                onChangeText={setNewReviewText}
                maxLength={500}
              />
              <Text style={styles.charCount}>{newReviewText.length}/500</Text>
              <TouchableOpacity
                style={[styles.submitButton, (!newRating || !newReviewText.trim()) && styles.submitButtonDisabled]}
                disabled={!newRating || !newReviewText.trim()}
              >
                <Text style={styles.submitButtonText}>Submit Review</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1C1C1C',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  summaryCard: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: '#1C1C1C',
    margin: 16,
    borderRadius: 16,
  },
  summaryLeft: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingRight: 20,
    borderRightWidth: 1,
    borderRightColor: '#333',
    minWidth: 100,
  },
  avgRating: {
    color: '#fff',
    fontSize: 48,
    fontWeight: '800',
    lineHeight: 56,
  },
  totalReviews: {
    color: '#888',
    fontSize: 13,
    marginTop: 6,
  },
  summaryRight: {
    flex: 1,
    paddingLeft: 20,
    justifyContent: 'center',
  },
  ratingBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 3,
    gap: 6,
  },
  ratingBarLabel: {
    color: '#888',
    fontSize: 12,
    width: 14,
    textAlign: 'right',
  },
  ratingBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: '#2A2A2A',
    borderRadius: 3,
    overflow: 'hidden',
  },
  ratingBarFill: {
    height: '100%',
    backgroundColor: '#FFD700',
    borderRadius: 3,
  },
  ratingBarCount: {
    color: '#888',
    fontSize: 11,
    width: 24,
    textAlign: 'right',
  },
  starsRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  writeReviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4ECDC4',
    marginHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 28,
    gap: 8,
  },
  writeReviewText: {
    color: '#121212',
    fontSize: 16,
    fontWeight: '700',
  },
  filterScroll: {
    maxHeight: 56,
    marginTop: 16,
  },
  filterContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1C1C1C',
    borderWidth: 1,
    borderColor: '#333',
  },
  filterTabActive: {
    backgroundColor: '#4ECDC4',
    borderColor: '#4ECDC4',
  },
  filterTabText: {
    color: '#ccc',
    fontSize: 13,
    fontWeight: '600',
  },
  filterTabTextActive: {
    color: '#121212',
    fontWeight: '700',
  },
  reviewsList: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
  reviewCard: {
    backgroundColor: '#1C1C1C',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewMeta: {
    marginLeft: 12,
  },
  reviewerName: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  reviewRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  reviewDate: {
    color: '#666',
    fontSize: 12,
  },
  reviewText: {
    color: '#ccc',
    fontSize: 14,
    lineHeight: 22,
  },
  reviewActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#2A2A2A',
  },
  helpfulButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  helpfulText: {
    color: '#888',
    fontSize: 13,
  },
  reportButton: {
    padding: 4,
  },
  devResponse: {
    marginTop: 12,
    padding: 12,
    backgroundColor: 'rgba(78,205,196,0.08)',
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#4ECDC4',
  },
  devResponseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  devResponseLabel: {
    color: '#4ECDC4',
    fontSize: 12,
    fontWeight: '700',
  },
  devResponseText: {
    color: '#aaa',
    fontSize: 13,
    lineHeight: 20,
  },
  bottomSpacer: {
    height: 40,
  },
  writeReviewOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  writeReviewCard: {
    backgroundColor: '#1C1C1C',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  writeReviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  writeReviewTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  writeReviewAppName: {
    color: '#888',
    fontSize: 14,
    marginBottom: 16,
  },
  starPicker: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  reviewInput: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 14,
    color: '#fff',
    fontSize: 15,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    color: '#666',
    fontSize: 12,
    textAlign: 'right',
    marginTop: 6,
  },
  submitButton: {
    backgroundColor: '#4ECDC4',
    paddingVertical: 14,
    borderRadius: 28,
    alignItems: 'center',
    marginTop: 16,
  },
  submitButtonDisabled: {
    backgroundColor: '#333',
  },
  submitButtonText: {
    color: '#121212',
    fontSize: 16,
    fontWeight: '700',
  },
});
