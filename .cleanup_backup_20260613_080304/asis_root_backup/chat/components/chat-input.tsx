/**
 * ASISChatInput Component
 * Message input with send button, voice toggle, and accessibility
 */

import React, { useState, useRef, useCallback } from 'react';
import { View, StyleSheet, TextInput, Keyboard } from 'react-native';
import { ChatTheme, LIGHT_THEME } from '../types';
import { sanitizeInput } from '../../shared/utils';

interface ASISChatInputProps {
  onSend: (message: string) => void;
  onVoiceStart?: () => void;
  onVoiceEnd?: (transcript: string) => void;
  disabled?: boolean;
  placeholder?: string;
  maxLength?: number;
  theme?: ChatTheme;
}

export const ASISChatInput: React.FC<ASISChatInputProps> = ({
  onSend,
  onVoiceStart,
  onVoiceEnd,
  const disabled = false,
  const placeholder = 'Ask ASIS anything...',
  const maxLength = 2000,
  const theme = LIGHT_THEME,
}) => {
  const [text, setText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const inputRef = useRef<any>(null);

  const handleSend = useCallback(() => {
    const sanitized = sanitizeInput(text);
    if (sanitized.trim() && !disabled) {
      onSend(sanitized);
      setText('');
      Keyboard.dismiss();
    }
  }, [text, disabled, onSend]);

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const handleVoicePress = useCallback(() => {
    if (isRecording) {
      setIsRecording(false);
      onVoiceEnd?.(''); // Would contain actual transcript
    } else {
      setIsRecording(true);
      onVoiceStart?.();
    }
  }, [isRecording, onVoiceStart, onVoiceEnd]);

  const styles = createStyles(theme);
  const canSend = text.trim().length > 0 && !disabled;

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        {/* Voice button */}
        {onVoiceStart && (
          <TouchableOpacity
            style={[
              styles.voiceButton,
              isRecording && styles.voiceButtonActive,
            ]}
            onPress={handleVoicePress}
            disabled={disabled}
            accessibilityLabel={isRecording ? 'Stop recording' : 'Start voice input'}
            accessibilityRole="button"
          >
            <Text style={styles.voiceButtonText}>
              {isRecording ? '⏹' : '🎤'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Text input */}
        <View style={styles.inputWrapper}>
          <textarea
            ref={inputRef}
            style={styles.input}
            value={text}
            onChangeText={(e) => setText(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={disabled ? 'Please wait...' : placeholder}
            maxLength={maxLength}
            disabled={disabled}
            rows={1}
            accessibilityLabel="Message input"
            accessibilityRole="textbox"
          />
          {text.length > 0 && (
            <Text style={styles.charCount}>
              {text.length}/{maxLength}
            </Text>
          )}
        </View>

        {/* Send button */}
        <TouchableOpacity
          style={[
            styles.sendButton,
            canSend ? styles.sendButtonActive : styles.sendButtonDisabled,
          ]}
          onPress={handleSend}
          disabled={!canSend}
          accessibilityLabel="Send message"
          accessibilityRole="button"
        >
          <Text style={styles.sendButtonText}>➤</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Inline components
const Text: React.FC<any> = ({ style, children }) => (
  <Text style={style}>{children}</Text>
);

const createStyles = (theme: ChatTheme) =>
  StyleSheet.create({
    container: {
      backgroundColor: theme.colors.surface,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: theme.spacing.sm,
    },
    voiceButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      justifyContent: 'center',
      alignItems: 'center',
      cursor: 'pointer',
      flexShrink: 0,
    },
    voiceButtonActive: {
      backgroundColor: `${theme.colors.error}20`,
      borderColor: theme.colors.error,
    },
    voiceButtonText: {
      fontSize: 18,
    },
    inputWrapper: {
      flex: 1,
      position: 'relative',
    },
    input: {
      width: '100%',
      minHeight: 40,
      maxHeight: 120,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      paddingRight: 50,
      backgroundColor: theme.colors.background,
      borderRadius: theme.borderRadius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      fontSize: theme.typography.sizeMd,
      color: theme.colors.text,
      resize: 'none',
      outline: 'none',
      fontFamily: 'inherit',
    },
    charCount: {
      position: 'absolute',
      right: theme.spacing.sm,
      bottom: theme.spacing.sm,
      fontSize: 10,
      color: theme.colors.textMuted,
    },
    sendButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      border: 'none',
      cursor: 'pointer',
      flexShrink: 0,
      transition: 'all 0.2s',
    },
    sendButtonActive: {
      backgroundColor: theme.colors.primary,
    },
    sendButtonDisabled: {
      backgroundColor: theme.colors.border,
      cursor: 'not-allowed',
    },
    sendButtonText: {
      fontSize: 18,
      color: '#FFFFFF',
    },
  });

export default ASISChatInput;