/**
 * MTAA OS — System Status Page
 */

import React from "react";
import { View } from "react-native";
import { SystemPanels } from "@/components/system/SystemPanels";

export default function SystemStatusPage() {
  return (
    <View style={{ flex: 1 }}>
      <SystemPanels />
    </View>
  );
}
