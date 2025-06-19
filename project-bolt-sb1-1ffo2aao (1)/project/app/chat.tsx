import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Send, Phone, Video, MoveVertical as MoreVertical, Shield } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';

interface Message {
  id: string;
  text: string;
  timestamp: string;
  isFromUser: boolean;
}

export default function ChatScreen() {
  const { partnerId, partnerName, partnerAvatar } = useLocalSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    loadMessages();
    
    // Simulate partner typing
    const typingInterval = setInterval(() => {
      if (Math.random() > 0.8) {
        setIsTyping(true);
        setTimeout(() => setIsTyping(false), 2000);
      }
    }, 10000);

    return () => clearInterval(typingInterval);
  }, []);

  const loadMessages = () => {
    // Mock messages
    const mockMessages: Message[] = [
      {
        id: '1',
        text: 'Hi! I saw we\'re both heading to the airport. Want to share a ride?',
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        isFromUser: false,
      },
      {
        id: '2',
        text: 'Yes, that sounds great! What time are you planning to leave?',
        timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
        isFromUser: true,
      },
      {
        id: '3',
        text: 'I was thinking around 2 PM. Does that work for you?',
        timestamp: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
        isFromUser: false,
      },
      {
        id: '4',
        text: 'Perfect! Should we meet at the main entrance?',
        timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        isFromUser: true,
      },
      {
        id: '5',
        text: 'Sounds good! I\'ll be wearing a blue jacket. See you there! 👋',
        timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
        isFromUser: false,
      },
    ];

    setMessages(mockMessages);
  };

  const sendMessage = () => {
    if (!newMessage.trim()) return;

    const message: Message = {
      id: Date.now().toString(),
      text: newMessage.trim(),
      timestamp: new Date().toISOString(),
      isFromUser: true,
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');

    // Simulate partner response
    setTimeout(() => {
      const responses = [
        'Thanks for the message!',
        'Got it! 👍',
        'Sounds good to me',
        'Perfect, see you then!',
        'Thanks for letting me know',
      ];
      
      const response: Message = {
        id: (Date.now() + 1).toString(),
        text: responses[Math.floor(Math.random() * responses.length)],
        timestamp: new Date().toISOString(),
        isFromUser: false,
      };

      setMessages(prev => [...prev, response]);
    }, 1000 + Math.random() * 2000);

    // Scroll to bottom
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#3B82F6', '#1E40AF']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft color="white" size={24} />
          </TouchableOpacity>
          
          <View style={styles.partnerInfo}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatar}>{partnerAvatar}</Text>
              <View style={styles.verifiedBadge}>
                <Shield color="white" size={10} />
              </View>
            </View>
            <View>
              <Text style={styles.partnerName}>{partnerName}</Text>
              <Text style={styles.onlineStatus}>
                {isTyping ? 'typing...' : 'online'}
              </Text>
            </View>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.actionButton}>
              <Phone color="white" size={20} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Video color="white" size={20} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <MoreVertical color="white" size={20} />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView 
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((message) => (
            <View
              key={message.id}
              style={[
                styles.messageContainer,
                message.isFromUser ? styles.userMessage : styles.partnerMessage,
              ]}
            >
              <View
                style={[
                  styles.messageBubble,
                  message.isFromUser ? styles.userBubble : styles.partnerBubble,
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    message.isFromUser ? styles.userMessageText : styles.partnerMessageText,
                  ]}
                >
                  {message.text}
                </Text>
              </View>
              <Text style={styles.messageTime}>
                {formatTime(message.timestamp)}
              </Text>
            </View>
          ))}

          {isTyping && (
            <View style={[styles.messageContainer, styles.partnerMessage]}>
              <View style={[styles.messageBubble, styles.partnerBubble, styles.typingBubble]}>
                <View style={styles.typingIndicator}>
                  <View style={styles.typingDot} />
                  <View style={styles.typingDot} />
                  <View style={styles.typingDot} />
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              placeholder="Type a message..."
              placeholderTextColor="#9CA3AF"
              value={newMessage}
              onChangeText={setNewMessage}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                newMessage.trim() ? styles.sendButtonActive : styles.sendButtonInactive,
              ]}
              onPress={sendMessage}
              disabled={!newMessage.trim()}
            >
              <Send 
                color={newMessage.trim() ? "white" : "#9CA3AF"} 
                size={20} 
              />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  partnerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarContainer: {
    position: 'relative',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    fontSize: 20,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  partnerName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: 'white',
  },
  onlineStatus: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatContainer: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 8,
  },
  messageContainer: {
    marginBottom: 16,
  },
  userMessage: {
    alignItems: 'flex-end',
  },
  partnerMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  userBubble: {
    backgroundColor: '#3B82F6',
    borderBottomRightRadius: 4,
  },
  partnerBubble: {
    backgroundColor: 'white',
    borderBottomLeftRadius: 4,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  messageText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    lineHeight: 22,
  },
  userMessageText: {
    color: 'white',
  },
  partnerMessageText: {
    color: '#1F2937',
  },
  messageTime: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
    marginHorizontal: 16,
  },
  typingBubble: {
    paddingVertical: 16,
  },
  typingIndicator: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#9CA3AF',
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#F9FAFB',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 12,
  },
  textInput: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#1F2937',
    maxHeight: 100,
    paddingVertical: 8,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonActive: {
    backgroundColor: '#3B82F6',
  },
  sendButtonInactive: {
    backgroundColor: '#E5E7EB',
  },
});