/**
 * ASISMessageBubble Component
 * Renders individual chat messages with proper styling and accessibility
 */

import React, { useState } from 'react';
import { View, StyleSheet, AccessibilityInfo } from 'react-native';
import { ChatMessage, ChatTheme, LIGHT_THEME } from '../types';
import { formatRelativeTime } from '../../shared/utils';

interface ASISMessageBubbleProps {
  message: ChatMessage;
  isUser: boolean;
  showAvatar?: boolean;
  onAction?: (actionId: string, payload: any) => void;
  theme?: ChatTheme;
}

export const ASISMessageBubble: React.FC<ASISMessageBubbleProps> = ({
  message,
  isUser,
  const showAvatar = true,
  onAction,
  const theme = LIGHT_THEME,
}) => {
  const [expanded, setExpanded] = useState(false);
  const isError = message.type === 'error';
  const isSystem = message.role === 'system';

  const handleActionPress = (actionId: string, payload: any) => {
    AccessibilityInfo.announceForAccessibility(`Selected action: ${actionId}`);
    onAction?.(actionId, payload);
  };

  const styles = createStyles(theme, isUser, isError, isSystem);

  return (
    <View
      style={styles.container}
      accessibilityLabel={`${isUser ? 'You' : 'ASIS'} said: ${message.content}`}
      accessibilityRole="text"
    >
      <View style={styles.bubbleContainer}>
        {showAvatar && !isUser && (
          <View style={styles.avatar}>
            <View style={styles.avatarInner}>
              <Text style={styles.avatarText}>A</Text>
            </View>
          </View>
        )}

        <View style={styles.bubbleWrapper}>
          <View style={styles.bubble}>
            {/* Message content */}
            <Text style={styles.content}>{message.content}</Text>

            {/* Streaming indicator */}
            {message.isStreaming && (
              <View style={styles.streamingIndicator}>
                <View style={styles.cursor} />
              </View>
            )}

            {/* Card rendering */}
            {message.card && (
              <View style={styles.card}>
                {message.card.image && (
                  <Image
                    src={message.card.image}
                    alt={message.card.title}
                    style={styles.cardImage}
                  />
                )}
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle}>{message.card.title}</Text>
                  {message.card.subtitle && (
                    <Text style={styles.cardSubtitle}>{message.card.subtitle}</Text>
                  )}
                  {message.card.description && (
                    <Text style={styles.cardDescription}>{message.card.description}</Text>
                  )}
                </View>
              </View>
            )}

            {/* Action buttons */}
            {message.actions && message.actions.length > 0 && (
              <View style={styles.actionsContainer}>
                {message.actions.map((action) => (
                  <TouchableOpacity
                    key={action.id}
                    style={[
                      styles.actionButton,
                      action.variant === 'primary' && styles.actionButtonPrimary,
                      action.variant === 'danger' && styles.actionButtonDanger,
                      action.variant === 'ghost' && styles.actionButtonGhost,
                      action.disabled && styles.actionButtonDisabled,
                    ]}
                    onPress={() => handleActionPress(action.id, action.payload)}
                    disabled={action.disabled || action.loading}
                    accessibilityLabel={action.label}
                    accessibilityRole="button"
                  >
                    {action.loading ? (
                      <View style={styles.loadingSpinner}>
                        <Text style={styles.actionButtonText}>...</Text>
                      </View>
                    ) : (
                      <Text style={styles.actionButtonText}>{action.label}</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Timestamp and status */}
          <View style={styles.metaContainer}>
            <Text style={styles.timestamp}>
              {formatRelativeTime(message.timestamp)}
            </Text>
            {isUser && message.status && (
              <Text style={styles.status}>
                {message.status === 'sent' && '✓'}
                {message.status === 'delivered' && '✓✓'}
                {message.status === 'read' && '✓✓'}
                {message.status === 'error' && '⚠'}
              </Text>
            )}
          </View>
        </View>
      </View>
    </View>
  );
};

// Inline components for compatibility
const Text: React.FC<any> = ({ style, children }) => (
  <Text style={style}>{children}</Text>
);

const createStyles = (
  theme: ChatTheme,
  isUser: boolean,
  isError: boolean,
  isSystem: boolean
) =>
  StyleSheet.create({
    container: {
      marginBottom: theme.spacing.md,
      width: '100%',
    },
    bubbleContainer: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
    },
    avatar: {
      width: 32,
      height: 32,
      marginRight: theme.spacing.sm,
      marginBottom: theme.spacing.sm,
    },
    avatarInner: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '600',
    },
    bubbleWrapper: {
      maxWidth: '75%',
      alignItems: isUser ? 'flex-end' : 'flex-start',
    },
    bubble: {
      backgroundColor: isError
        ? `${theme.colors.error}15`
        : isSystem
        ? `${theme.colors.secondary}10`
        : isUser
        ? theme.colors.userBubble
        : theme.colors.asisBubble,
      borderRadius: theme.borderRadius.lg,
      borderBottomRightRadius: isUser ? 4 : theme.borderRadius.lg,
      borderBottomLeftRadius: isUser ? theme.borderRadius.lg : 4,
      padding: theme.spacing.md,
      ...(!isUser && {
        borderWidth: 1,
        borderColor: theme.colors.border,
      }),
    },
    content: {
      fontSize: theme.typography.sizeMd,
      lineHeight: theme.typography.lineHeight * theme.typography.sizeMd,
      color: isUser ? theme.colors.userText : theme.colors.asisText,
      wordWrap: 'break-word',
    },
    streamingIndicator: {
      marginTop: 4,
    },
    cursor: {
      width: 2,
      height: 16,
      backgroundColor: theme.colors.primary,
      animation: 'blink 1s infinite',
    },
    card: {
      marginTop: theme.spacing.md,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      overflow: 'hidden',
    },
    cardImage: {
      width: '100%',
      height: 120,
      objectFit: 'cover',
    },
    cardContent: {
      padding: theme.spacing.md,
    },
    cardTitle: {
      fontSize: theme.typography.sizeMd,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    cardSubtitle: {
      fontSize: theme.typography.sizeSm,
      color: theme.colors.textMuted,
      marginBottom: theme.spacing.sm,
    },
    cardDescription: {
      fontSize: theme.typography.sizeSm,
      color: theme.colors.text,
      lineHeight: theme.typography.lineHeight * theme.typography.sizeSm,
    },
    actionsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
      marginTop: theme.spacing.md,
    },
    actionButton: {
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.borderRadius.md,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      cursor: 'pointer',
    },
    actionButtonPrimary: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    actionButtonDanger: {
      backgroundColor: theme.colors.error,
      borderColor: theme.colors.error,
    },
    actionButtonGhost: {
      backgroundColor: 'transparent',
      borderColor: 'transparent',
    },
    actionButtonDisabled: {
      opacity: 0.5,
      cursor: 'not-allowed',
    },
    actionButtonText: {
      fontSize: theme.typography.sizeSm,
      color: theme.colors.text,
      fontWeight: '500',
    },
    metaContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: theme.spacing.xs,
      gap: theme.spacing.sm,
    },
    timestamp: {
      fontSize: 10,
      color: theme.colors.textMuted,
    },
    status: {
      fontSize: 10,
      color: theme.colors.textMuted,
    },
    loadingSpinner: {
      opacity: 0.7,
    },
  });

export default ASISMessageBubble;