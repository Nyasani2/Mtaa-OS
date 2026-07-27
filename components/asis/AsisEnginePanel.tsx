/**
 * ASIS CSE v2 — Engine Status Panel
 * Shows active engines, confidence scores, reasoning steps, and tool calls.
 * Replaces the hardcoded 75% confidence and fake engine tabs.
 *
 * @module components/asis/AsisEnginePanel
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { EngineStatus } from '@/lib/hooks/use-asis-chat';

// ============================================================================
// PROPS
// ============================================================================

interface AsisEnginePanelProps {
  engineStatus: EngineStatus[];
  confidence: number;
  intent: string;
  reasoning: string;
  isLoading: boolean;
}

// ============================================================================
// ENGINE STATUS BADGE
// ============================================================================

function EngineBadge({ engine }: { engine: EngineStatus }) {
  const statusColors: Record<string, string> = {
    idle: '#6b7280',
    running: '#3b82f6',
    complete: '#22c55e',
    error: '#ef4444',
  };

  return (
    <View style={[styles.badge, { borderColor: statusColors[engine.status] || '#6b7280' }]}>
      <View
        style={[
          styles.badgeDot,
          { backgroundColor: statusColors[engine.status] || '#6b7280' },
        ]}
      />
      <Text style={styles.badgeName}>{engine.name}</Text>
      <Text style={[styles.badgeStatus, { color: statusColors[engine.status] || '#6b7280' }]}>
        {engine.status.toUpperCase()}
      </Text>
    </View>
  );
}

// ============================================================================
// CONFIDENCE METER
// ============================================================================

function ConfidenceMeter({ confidence }: { confidence: number }) {
  const pct = Math.round(confidence * 100);
  const color =
    confidence >= 0.8 ? '#22c55e' : confidence >= 0.5 ? '#f59e0b' : '#ef4444';

  return (
    <View style={styles.confidenceContainer}>
      <Text style={styles.confidenceLabel}>Confidence</Text>
      <View style={styles.confidenceBarBg}>
        <View
          style={[
            styles.confidenceBarFill,
            { width: `${pct}%`, backgroundColor: color },
          ]}
        />
      </View>
      <Text style={[styles.confidenceValue, { color }]}>{pct}%</Text>
    </View>
  );
}

// ============================================================================
// MAIN PANEL
// ============================================================================

export function AsisEnginePanel({
  engineStatus,
  confidence,
  intent,
  reasoning,
  isLoading,
}: AsisEnginePanelProps) {
  const activeEngines = engineStatus.filter((e) => e.status !== 'idle');

  return (
    <View style={styles.container}>
      {/* Top row: Intent + Confidence */}
      <View style={styles.topRow}>
        {intent ? (
          <View style={styles.intentBadge}>
            <Text style={styles.intentLabel}>INTENT</Text>
            <Text style={styles.intentValue}>{intent.toUpperCase()}</Text>
          </View>
        ) : (
          <View style={styles.intentBadge}>
            <Text style={styles.intentLabel}>INTENT</Text>
            <Text style={[styles.intentValue, { color: '#6b7280' }]}>
              {isLoading ? 'CLASSIFYING...' : 'IDLE'}
            </Text>
          </View>
        )}
        <ConfidenceMeter confidence={confidence} />
      </View>

      {/* Engine badges */}
      {activeEngines.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.engineScroll}
          contentContainerStyle={styles.engineScrollContent}
        >
          {activeEngines.map((engine) => (
            <EngineBadge key={engine.name} engine={engine} />
          ))}
        </ScrollView>
      )}

      {/* Reasoning */}
      {reasoning && (
        <View style={styles.reasoningBox}>
          <Text style={styles.reasoningLabel}>REASONING</Text>
          <Text style={styles.reasoningText} numberOfLines={3}>
            {reasoning}
          </Text>
        </View>
      )}
    </View>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0f172a',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 8,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  intentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1e293b',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  intentLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 0.5,
  },
  intentValue: {
    fontSize: 11,
    fontWeight: '600',
    color: '#3b82f6',
  },
  confidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    justifyContent: 'flex-end',
  },
  confidenceLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 0.5,
  },
  confidenceBarBg: {
    width: 80,
    height: 6,
    backgroundColor: '#1e293b',
    borderRadius: 3,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#334155',
  },
  confidenceBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  confidenceValue: {
    fontSize: 11,
    fontWeight: '700',
    minWidth: 28,
    textAlign: 'right',
  },
  engineScroll: {
    maxHeight: 32,
  },
  engineScrollContent: {
    gap: 6,
    paddingRight: 12,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1e293b',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
  },
  badgeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  badgeName: {
    fontSize: 10,
    fontWeight: '600',
    color: '#e2e8f0',
  },
  badgeStatus: {
    fontSize: 8,
    fontWeight: '700',
  },
  reasoningBox: {
    backgroundColor: '#1e293b',
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  reasoningLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  reasoningText: {
    fontSize: 11,
    color: '#94a3b8',
    lineHeight: 16,
  },
});

export default AsisEnginePanel;
