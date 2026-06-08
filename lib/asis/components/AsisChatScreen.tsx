import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useAsis } from '../hooks/useAsis';
import { AsisMessage, AsisAction, AsisInsight } from '../types';

const { width } = Dimensions.get('window');

interface AsisChatScreenProps {
  userId: string;
}

export function AsisChatScreen({ userId }: AsisChatScreenProps) {
  const params = useLocalSearchParams();
  const initialDomain = (params.domain as string) || 'general';
  const initialMessage = (params.message as string) || '';

  const [inputText, setInputText] = useState(initialMessage);
  const [selectedDomain, setSelectedDomain] = useState(initialDomain);
  const flatListRef = useRef<FlatList>(null);

  const {
    messages,
    isLoading,
    isTyping,
    error,
    sendMessage,
    clearChat,
    suggestions,
  } = useAsis({
    userId,
    app: 'asis',
    domain: selectedDomain as any,
    onAction: handleAction,
    onInsight: handleInsight,
    onError: handleError,
  });

  useEffect(() => {
    if (initialMessage) {
      sendMessage(initialMessage);
    }
  }, []);

  const handleAction = useCallback((action: AsisAction) => {
    console.log('ASIS Action:', action);
    // Handle navigation, triggers, etc.
    // This would integrate with your router/navigation system
  }, []);

  const handleInsight = useCallback((insight: AsisInsight) => {
    console.log('ASIS Insight:', insight);
    // Show insight notifications, badges, etc.
  }, []);

  const handleError = useCallback((err: Error) => {
    console.error('ASIS Error:', err);
  }, []);

  const handleSend = useCallback(() => {
    if (!inputText.trim() || isLoading) return;
    sendMessage(inputText.trim());
    setInputText('');
  }, [inputText, isLoading, sendMessage]);

  const handleSuggestionPress = useCallback((suggestion: string) => {
    sendMessage(suggestion);
  }, [sendMessage]);

  const scrollToBottom = useCallback(() => {
    flatListRef.current?.scrollToEnd({ animated: true });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const renderMessage = useCallback(({ item, index }: { item: AsisMessage; index: number }) => {
    const isUser = item.role === 'user';
    const isSystem = item.role === 'system';

    return (
      <View
        style={[
          styles.messageContainer,
          isUser ? styles.userMessage : isSystem ? styles.systemMessage : styles.asisMessage,
        ]}
      >
        <View style={styles.messageBubble}>
          <Text style={[
            styles.messageText,
            isUser ? styles.userText : isSystem ? styles.systemText : styles.asisText,
          ]}>
            {item.content}
          </Text>
          <Text style={styles.timestamp}>
            {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>

        {/* Render actions if present */}
        {item.metadata?.actions && (
          <View style={styles.actionsContainer}>
            {item.metadata.actions.map((action: AsisAction, idx: number) => (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.actionButton,
                  action.requiresConfirmation && styles.actionButtonWarning,
                ]}
                onPress={() => handleAction(action)}
              >
                <Text style={styles.actionButtonText}>{action.description}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  }, [handleAction]);

  const domains = [
    { key: 'general', label: 'General', icon: '◆' },
    { key: 'wallet', label: 'Wallet', icon: '◈' },
    { key: 'transport', label: 'Transport', icon: '◉' },
    { key: 'health', label: 'Health', icon: '◊' },
    { key: 'jobs', label: 'Jobs', icon: '◎' },
    { key: 'civic', label: 'Civic', icon: '◐' },
  ];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>ASIS</Text>
          <View style={styles.statusIndicator}>
            <View style={[styles.statusDot, isLoading ? styles.statusLoading : styles.statusActive]} />
            <Text style={styles.statusText}>
              {isLoading ? 'Thinking...' : isTyping ? 'Typing...' : 'Online'}
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={clearChat} style={styles.clearButton}>
          <Text style={styles.clearButtonText}>Clear</Text>
        </TouchableOpacity>
      </View>

      {/* Domain Selector */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.domainSelector}
        contentContainerStyle={styles.domainSelectorContent}
      >
        {domains.map((domain) => (
          <TouchableOpacity
            key={domain.key}
            style={[
              styles.domainButton,
              selectedDomain === domain.key && styles.domainButtonActive,
            ]}
            onPress={() => setSelectedDomain(domain.key)}
          >
            <Text style={styles.domainIcon}>{domain.icon}</Text>
            <Text style={[
              styles.domainLabel,
              selectedDomain === domain.key && styles.domainLabelActive,
            ]}>
              {domain.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(_, index) => index.toString()}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContent}
        onContentSizeChange={scrollToBottom}
      />

      {/* Suggestions */}
      {suggestions.length > 0 && !isLoading && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.suggestionsContainer}
          contentContainerStyle={styles.suggestionsContent}
        >
          {suggestions.map((suggestion, index) => (
            <TouchableOpacity
              key={index}
              style={styles.suggestionChip}
              onPress={() => handleSuggestionPress(suggestion)}
            >
              <Text style={styles.suggestionText}>{suggestion}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder={`Ask ASIS about ${selectedDomain}...`}
          placeholderTextColor="#8e8e93"
          multiline
          maxLength={1000}
          onSubmitEditing={handleSend}
          returnKeyType="send"
        />
        <TouchableOpacity
          style={[styles.sendButton, (!inputText.trim() || isLoading) && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!inputText.trim() || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.sendButtonText}>➤</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Error Banner */}
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error.message}</Text>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1c1c1e',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 1,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusActive: {
    backgroundColor: '#30d158',
  },
  statusLoading: {
    backgroundColor: '#ff9f0a',
  },
  statusText: {
    fontSize: 12,
    color: '#8e8e93',
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#1c1c1e',
  },
  clearButtonText: {
    fontSize: 12,
    color: '#ff453a',
    fontWeight: '500',
  },
  domainSelector: {
    maxHeight: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#1c1c1e',
  },
  domainSelectorContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  domainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1c1c1e',
    marginRight: 8,
  },
  domainButtonActive: {
    backgroundColor: '#3584e4',
  },
  domainIcon: {
    fontSize: 14,
    color: '#8e8e93',
  },
  domainLabel: {
    fontSize: 13,
    color: '#8e8e93',
    fontWeight: '500',
  },
  domainLabelActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    gap: 16,
  },
  messageContainer: {
    maxWidth: width * 0.85,
  },
  userMessage: {
    alignSelf: 'flex-end',
  },
  asisMessage: {
    alignSelf: 'flex-start',
  },
  systemMessage: {
    alignSelf: 'center',
    maxWidth: width * 0.9,
  },
  messageBubble: {
    padding: 12,
    borderRadius: 16,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  userText: {
    color: '#ffffff',
  },
  asisText: {
    color: '#ffffff',
  },
  systemText: {
    color: '#ff453a',
    fontStyle: 'italic',
  },
  timestamp: {
    fontSize: 10,
    color: '#8e8e93',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  actionsContainer: {
    marginTop: 8,
    gap: 6,
  },
  actionButton: {
    backgroundColor: '#2c2c2e',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#30d158',
  },
  actionButtonWarning: {
    borderLeftColor: '#ff9f0a',
  },
  actionButtonText: {
    fontSize: 13,
    color: '#ffffff',
    fontWeight: '500',
  },
  suggestionsContainer: {
    maxHeight: 44,
    borderTopWidth: 1,
    borderTopColor: '#1c1c1e',
    paddingVertical: 8,
  },
  suggestionsContent: {
    paddingHorizontal: 12,
    gap: 8,
  },
  suggestionChip: {
    backgroundColor: '#1c1c1e',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2c2c2e',
  },
  suggestionText: {
    fontSize: 12,
    color: '#8e8e93',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#1c1c1e',
    backgroundColor: '#000000',
  },
  input: {
    flex: 1,
    backgroundColor: '#1c1c1e',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
    color: '#ffffff',
    fontSize: 15,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3584e4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#2c2c2e',
  },
  sendButtonText: {
    color: '#ffffff',
    fontSize: 18,
  },
  errorBanner: {
    backgroundColor: '#3a1a1a',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#ff453a',
  },
  errorText: {
    color: '#ff453a',
    fontSize: 13,
    textAlign: 'center',
  },
});

export default AsisChatScreen;
