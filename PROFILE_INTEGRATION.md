// ============================================================================
// PROFILE INTEGRATION — Add these lines to your existing app/(os)/profile/index.tsx
// ============================================================================

// STEP 1: Add imports at top:
import MediaGallery from '@/lib/asis/components/MediaGallery';
import { useRouter } from 'expo-router';

// STEP 2: Inside ProfileScreen component, add:
const router = useRouter();
const [userId, setUserId] = useState(null);

useEffect(() => {
  async function getUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setUserId(user.id);
  }
  getUser();
}, []);

// STEP 3: Insert this ABOVE your Wallet section:
<View style={{ paddingHorizontal: 16, marginBottom: 20 }}>
  <MediaGallery userId={userId} onUploadPress={() => router.push('/upload')} />
</View>
