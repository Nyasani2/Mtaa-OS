
import { View, Text, ScrollView } from 'react-native';
import { useEducationFeed } from '../../hooks/useEducationFeed';
import FeedPostCard from '../../components/FeedPostCard';

export default function FeedPage() {
  // In real app, get from user's school context
  const institutionId = 'placeholder';
  const isJunior = false; // Would be determined by user's age

  const { data: posts, isLoading } = useEducationFeed(institutionId, isJunior);

  return (
    <View style={{ flex: 1, backgroundColor: '#0f172a' }}>
      <View style={{ padding: 20 }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 8 }}>
          School News
        </Text>
        <Text style={{ color: '#94a3b8', fontSize: 14 }}>
          {isJunior ? 'Junior Feed (Under 14)' : 'All Posts'}
        </Text>
      </View>

      <ScrollView style={{ paddingHorizontal: 20 }}>
        {isLoading ? (
          <Text style={{ color: '#94a3b8', textAlign: 'center', marginTop: 40 }}>Loading...</Text>
        ) : posts?.map(post => (
          <FeedPostCard
            key={post.id}
            post={post}
            onLike={() => {}}
            onComment={() => {}}
          />
        ))}
      </ScrollView>
    </View>
  );
}
