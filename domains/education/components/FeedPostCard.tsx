
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Heart, MessageCircle, Pin } from 'lucide-react-native';

interface Props {
  post: any;
  onLike: () => void;
  onComment: () => void;
}

export default function FeedPostCard({ post, onLike, onComment }: Props) {
  return (
    <View style={{
      backgroundColor: '#1e293b',
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        <Image
          source={{ uri: post.author?.avatar_url || 'https://via.placeholder.com/40' }}
          style={{ width: 40, height: 40, borderRadius: 20 }}
        />
        <View style={{ marginLeft: 12, flex: 1 }}>
          <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>
            {post.author?.full_name || 'Unknown'}
          </Text>
          <Text style={{ color: '#94a3b8', fontSize: 11 }}>
            {post.author_role} • {new Date(post.created_at).toLocaleDateString()}
          </Text>
        </View>
        {post.is_pinned && <Pin size={18} color="#f59e0b" />}
      </View>

      {post.title && (
        <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 8 }}>
          {post.title}
        </Text>
      )}
      <Text style={{ color: '#cbd5e1', fontSize: 14, lineHeight: 20 }}>
        {post.content}
      </Text>

      <View style={{ flexDirection: 'row', marginTop: 16, gap: 24 }}>
        <TouchableOpacity onPress={onLike} style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Heart size={18} color="#ef4444" />
          <Text style={{ color: '#94a3b8', fontSize: 12, marginLeft: 6 }}>
            {post.likes_count}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onComment} style={{ flexDirection: 'row', alignItems: 'center' }}>
          <MessageCircle size={18} color="#3b82f6" />
          <Text style={{ color: '#94a3b8', fontSize: 12, marginLeft: 6 }}>
            {post.comments_count}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
