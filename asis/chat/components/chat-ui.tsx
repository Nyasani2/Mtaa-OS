/**
 * ASISChatUI Component
 * Main chat interface component for React Native / React
 * Mobile-first, accessible, theme-aware
 */

import React, { useRef, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  AccessibilityInfo,
  findNodeHandle,
  AccessibilityActionEvent,
} from 'react-native';
import { ASISMessageBubble } from './message-bubble';
import { ASISChatInput } from './chat-input';
import { ASISActionButtons } from './action-buttons';
import { useASISChat } from '../hooks/use-asis-chat';
import { ASISChatEngine } from '../chat-engine';
import { ChatTheme, LIGHT_THEME, DARK_THEME } from '../types';

interface ASISChatUIProps {
  engine: ASISChatEngine;
  theme?: 'light' | 'dark' | 'system';
  customTheme?: Partial<ChatTheme>;
  placeholder?: string;
  showHeader?: boolean;
  headerTitle?: string;
  onClose?: () => void;
  accessibilityLabel?: string;
}

export const ASISChatUI: React.FC<ASISChatUIProps> = ({
  engine,
  theme = 'system',
  customTheme,
  placeholder = 'Ask ASIS anything...',
  showHeader = true,
  headerTitle = 'ASIS AI',
  onClose,
  accessibilityLabel = 'ASIS Chat Interface',
}) => {
  const { state, sendMessage, executeAction, clearHistory, isReady } = useASISChat({ engine });
  const scrollViewRef = useRef<ScrollView>(null);
  const messagesEndRef = useRef<View>(null);

  // Determine active theme
  const activeTheme = React.useMemo(() => {
    const base = theme === 'dark' ? DARK_THEME : LIGHT_THEME;
    if (customTheme) {
      return {
        ...base,
        colors: { ...base.colors, ...customTheme.colors },
        spacing: { ...base.spacing, ...customTheme.spacing },
        borderRadius: { ...base.borderRadius, ...customTheme.borderRadius },
        typography: { ...base.typography, ...customTheme.typography },
      };
    }
    return base;
  }, [theme, customTheme]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current && scrollViewRef.current) {
      const handle = findNodeHandle(messagesEndRef.current);
      if (handle) {
        scrollViewRef.current.scrollToEnd({ animated: true });
      }
    }
  }, [state.messages.length, state.isLoading]);

  // Announce new messages for screen readers
  useEffect(() => {
    const lastMessage = state.messages[state.messages.length - 1];
    if (lastMessage && lastMessage.role === 'asis') {
      AccessibilityInfo.announceForAccessibility(
        `New message from ASIS: ${lastMessage.content.substring(0, 100)}`
      );
    }
  }, [state.messages]);

  const handleSend = useCallback(
    (text: string) => {
      sendMessage(text);
    },
    [sendMessage]
  );

  const handleAction = useCallback(
    (actionId: string, payload: any) => {
      const action = state.messages
        .flatMap((m) => m.actions || [])
        .find((a) => a.id === actionId);
      if (action) {
        executeAction(action);
      }
    },
    [state.messages, executeAction]
  );

  const handleSuggestionPress = useCallback(
    (suggestion: string) => {
      sendMessage(suggestion);
    },
    [sendMessage]
  );

  const styles = createStyles(activeTheme);

  if (!isReady) {
    return (
      <View style={styles.container} accessibilityLabel="Loading chat...">
        <View style={styles.loadingContainer}>
          {/* Loading indicator would go here */}
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {showHeader && (
        <View style={styles.header} accessibilityRole="header">
          <View style={styles.headerContent}>
            <View style={styles.statusIndicator}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: engine.state.health === 'healthy' ? '#28A745' : '#FFC107' },
                ]}
              />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.headerTitle} accessibilityRole="header">
                {headerTitle}
              </Text>
              <Text style={styles.headerSubtitle}>
                {state.isLoading ? 'Typing...' : 'Online'}
              </Text>
            </View>
          </View>
          {onClose && (
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              accessibilityLabel="Close chat"
              accessibilityRole="button"
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        keyboardShouldPersistTaps="handled"
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="scrollbar"
      >
        {state.messages.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              Welcome to ASIS. How can I help you today?
            </Text>
            <View style={styles.quickActions}>
              {['Check balance', 'Book a ride', 'Find jobs', 'Health services'].map((action) => (
                <TouchableOpacity
                  key={action}
                  style={styles.quickActionButton}
                  onPress={() => handleSuggestionPress(action)}
                  accessibilityLabel={action}
                  accessibilityRole="button"
                >
                  <Text style={styles.quickActionText}>{action}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {state.messages.map((message, index) => (
          <ASISMessageBubble
            key={message.id}
            message={message}
            isUser={message.role === 'user'}
            showAvatar={index === 0 || state.messages[index - 1]?.role !== message.role}
            onAction={handleAction}
            theme={activeTheme}
          />
        ))}

        {state.isLoading && !state.isStreaming && (
          <View style={styles.typingContainer} accessibilityLabel="ASIS is typing">
            <View style={styles.typingBubble}>
              <View style={styles.typingDots}>
                <View style={[styles.typingDot, styles.typingDot1]} />
                <View style={[styles.typingDot, styles.typingDot2]} />
                <View style={[styles.typingDot, styles.typingDot3]} />
              </View>
            </View>
          </View>
        )}

        <View ref={messagesEndRef} style={styles.messagesEnd} />
      </ScrollView>

      {state.suggestions.length > 0 && !state.isLoading && (
        <ASISActionButtons
          suggestions={state.suggestions}
          onPress={handleSuggestionPress}
          theme={activeTheme}
        />
      )}

      <ASISChatInput
        onSend={handleSend}
        disabled={state.isLoading}
        placeholder={placeholder}
        theme={activeTheme}
      />
    </KeyboardAvoidingView>
  );
};

// Inline Text component for React Native compatibility
const Text: React.FC<any> = ({ style, children, ...props }) => {
  return <span style={style} {...props}>{children}</span>;
};

const TouchableOpacity: React.FC<any> = ({ onPress, style, children, ...props }) => {
  return (
    <button
      onClick={onPress}
      style={{ border: 'none', background: 'none', padding: 0, ...style }}
      {...props}
    >
      {children}
    </button>
  );
};

const createStyles = (theme: ChatTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    headerContent: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    statusIndicator: {
      marginRight: theme.spacing.md,
    },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    headerText: {
      flex: 1,
    },
    headerTitle: {
      fontSize: theme.typography.sizeLg,
      fontWeight: '600',
      color: theme.colors.text,
    },
    headerSubtitle: {
      fontSize: theme.typography.sizeSm,
      color: theme.colors.textMuted,
      marginTop: 2,
    },
    closeButton: {
      padding: theme.spacing.sm,
    },
    closeButtonText: {
      fontSize: 18,
      color: theme.colors.textMuted,
    },
    messagesContainer: {
      flex: 1,
    },
    messagesContent: {
      padding: theme.spacing.md,
      paddingBottom: theme.spacing.xl,
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 40,
    },
    emptyStateText: {
      fontSize: theme.typography.sizeMd,
      color: theme.colors.textMuted,
      textAlign: 'center',
      marginBottom: theme.spacing.lg,
    },
    quickActions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: theme.spacing.sm,
    },
    quickActionButton: {
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.borderRadius.md,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
    },
    quickActionText: {
      fontSize: theme.typography.sizeSm,
      color: theme.colors.primary,
    },
    typingContainer: {
      flexDirection: 'row',
      marginBottom: theme.spacing.md,
    },
    typingBubble: {
      backgroundColor: theme.colors.asisBubble,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.md,
      maxWidth: '80%',
    },
    typingDots: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    typingDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: theme.colors.textMuted,
    },
    typingDot1: {
      opacity: 0.4,
    },
    typingDot2: {
      opacity: 0.7,
    },
    typingDot3: {
      opacity: 1,
    },
    messagesEnd: {
      height: 1,
    },
  });

export default ASISChatUI;
