// Add to your app routing (Expo Router example)
// app/(os)/agent/index.tsx        -> AgentHubScreen
// app/(os)/agent/register.tsx     -> AgentRegistrationScreen
// app/(os)/agent/dashboard.tsx    -> AgentDashboardScreen
// app/(os)/agent/deposit.tsx      -> <AgentTransactionScreen mode="deposit" />
// app/(os)/agent/withdrawal.tsx   -> <AgentTransactionScreen mode="withdrawal" />
// app/(os)/agent/topup.tsx        -> AgentFloatTopupScreen
// app/(os)/agent/map.tsx          -> AgentMapScreen

// Or in your tab/navigator:
import { AgentHubScreen, AgentRegistrationScreen, AgentDashboardScreen,
         AgentTransactionScreen, AgentMapScreen, AgentFloatTopupScreen } from '@/components/agent';

// Dependencies needed:
// npm install react-native-qrcode-svg
// (for QR code display on agent dashboard)
