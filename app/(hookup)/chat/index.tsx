import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
} from "react-native";

import { useState } from "react";

export default function ChatScreen() {

  const [message, setMessage] =
    useState("");

  const [messages, setMessages] =
    useState([
      {
        id: "1",
        content: "Hey 👋",
      },
      {
        id: "2",
        content: "Nice to meet you.",
      },
    ]);

  function send() {

    if (!message.trim()) return;

    setMessages([
      ...messages,
      {
        id: Date.now().toString(),
        content: message,
      },
    ]);

    setMessage("");
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#050816",
      }}
    >

      <FlatList
        style={{
          flex: 1,
          padding: 20,
        }}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View
            style={{
              backgroundColor: "#111827",
              padding: 14,
              borderRadius: 14,
              marginBottom: 12,
              alignSelf: "flex-start",
              maxWidth: "80%",
            }}
          >
            <Text
              style={{
                color: "white",
              }}
            >
              {item.content}
            </Text>
          </View>
        )}
      />

      <View
        style={{
          flexDirection: "row",
          padding: 14,
          borderTopWidth: 1,
          borderTopColor: "#111827",
        }}
      >

        <TextInput
          value={message}
          onChange={setMessage}
          placeholder="Message..."
          placeholderTextColor="#6B7280"
          style={{
            flex: 1,
            backgroundColor: "#111827",
            color: "white",
            padding: 16,
            borderRadius: 14,
          }}
        />

        <Pressable
          onPress={send}
          style={{
            backgroundColor: "#EC4899",
            marginLeft: 10,
            paddingHorizontal: 20,
            justifyContent: "center",
            borderRadius: 14,
          }}
        >
          <Text
            style={{
              color: "white",
              fontWeight: "bold",
            }}
          >
            Send
          </Text>
        </Pressable>

      </View>

    </View>
  );
}
