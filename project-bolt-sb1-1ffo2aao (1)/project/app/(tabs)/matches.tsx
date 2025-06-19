import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MapPin, Star, MessageCircle, Phone, Clock, Users, Shield, X, Ban } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

interface Match {
  id: string;
  name: string;
  rating: number;
  distance: string;
  destination: string;
  avatar: string;
  matchPercentage: number;
  isVerified: boolean;
  totalRides: number;
  phone: string;
  preferences: {
    allowMessages: boolean;
    allowCalls: boolean;
  };
}

export default function MatchesScreen() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [currentRequest, setCurrentRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [rejectedUsers, setRejectedUsers] = useState<string[]>([]);
  const { user, blockUser } = useAuth();

  useEffect(() => {
    loadMatches();
    loadRejectedUsers();
  }, []);

  const loadMatches = async () => {
    try {
      const matchesData = await AsyncStorage.getItem('currentMatches');
      const requestData = await AsyncStorage.getItem('currentRideRequest');
      
      if (matchesData) {
        const allMatches = JSON.parse(matchesData);
        // Filter out blocked users
        const filteredMatches = allMatches.filter((match: Match) => 
          !user?.blockedUsers.includes(match.id)
        );
        setMatches(filteredMatches);
      }
      
      if (requestData) {
        setCurrentRequest(JSON.parse(requestData));
      }
    } catch (error) {
      console.error('Error loading matches:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRejectedUsers = async () => {
    try {
      const rejected = await AsyncStorage.getItem('rejectedUsers');
      if (rejected) {
        setRejectedUsers(JSON.parse(rejected));
      }
    } catch (error) {
      console.error('Error loading rejected users:', error);
    }
  };

  const handleRejectMatch = async (matchId: string) => {
    try {
      const updatedRejected = [...rejectedUsers, matchId];
      await AsyncStorage.setItem('rejectedUsers', JSON.stringify(updatedRejected));
      setRejectedUsers(updatedRejected);
      
      // Remove from current matches
      const updatedMatches = matches.filter(match => match.id !== matchId);
      setMatches(updatedMatches);
      await AsyncStorage.setItem('currentMatches', JSON.stringify(updatedMatches));
    } catch (error) {
      console.error('Error rejecting match:', error);
    }
  };

  const handleBlockUser = async (match: Match) => {
    Alert.alert(
      'Block User',
      `Are you sure you want to block ${match.name}? They won't be able to see your rides or contact you.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: async () => {
            await blockUser(match.id);
            await handleRejectMatch(match.id);
            Alert.alert('User Blocked', `${match.name} has been blocked.`);
          },
        },
      ]
    );
  };

  const handleSelectMatch = async (match: Match) => {
    Alert.alert(
      'Confirm Ride Share',
      `Would you like to share a ride with ${match.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: () => confirmRideShare(match) },
      ]
    );
  };

  const confirmRideShare = async (match: Match) => {
    try {
      const rideHistory = {
        id: Date.now().toString(),
        partnerId: match.id,
        partnerName: match.name,
        partnerRating: match.rating,
        destination: currentRequest?.destination || '',
        date: new Date().toISOString(),
        status: 'active',
        userRating: null,
        partnerRating: null,
      };

      // Store active ride
      await AsyncStorage.setItem('activeRide', JSON.stringify({
        ...rideHistory,
        partnerPhone: match.phone,
        partnerAvatar: match.avatar,
      }));

      // Clear current matches and request
      await AsyncStorage.removeItem('currentMatches');
      await AsyncStorage.removeItem('currentRideRequest');

      Alert.alert(
        'Ride Confirmed!',
        `Your ride with ${match.name} has been confirmed. You can now track your ride and chat with your ride partner.`,
        [
          {
            text: 'Start Tracking',
            onPress: () => router.push('/tracking'),
          },
        ]
      );
    } catch (error) {
      console.error('Error confirming ride:', error);
      Alert.alert('Error', 'Failed to confirm ride. Please try again.');
    }
  };

  const handleStartChat = (match: Match) => {
    if (!match.preferences.allowMessages) {
      Alert.alert('Messages Disabled', `${match.name} has disabled messages. Try calling instead.`);
      return;
    }
    
    router.push({
      pathname: '/chat',
      params: {
        partnerId: match.id,
        partnerName: match.name,
        partnerAvatar: match.avatar,
      },
    });
  };

  const handleCall = (match: Match) => {
    if (!match.preferences.allowCalls) {
      Alert.alert('Calls Disabled', `${match.name} has disabled calls. Try messaging instead.`);
      return;
    }
    
    Alert.alert(
      'Call Partner',
      `Would you like to call ${match.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call', onPress: () => {
          // In a real app, this would initiate a call
          Alert.alert('Calling...', `Calling ${match.name} at ${match.phone}`);
        }},
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading matches...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (matches.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Users color="#9CA3AF" size={64} />
          <Text style={styles.emptyTitle}>No Matches Found</Text>
          <Text style={styles.emptySubtitle}>
            Try searching for rides from the Find Ride tab or adjust your preferences
          </Text>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.push('/')}
          >
            <Text style={styles.backButtonText}>Find New Ride</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#3B82F6', '#1E40AF']} style={styles.header}>
        <Text style={styles.headerTitle}>Ride Matches</Text>
        <Text style={styles.headerSubtitle}>
          {matches.length} people found near you
        </Text>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {currentRequest && (
          <View style={styles.requestCard}>
            <View style={styles.requestHeader}>
              <MapPin color="#3B82F6" size={20} />
              <Text style={styles.requestTitle}>Your Destination</Text>
            </View>
            <Text style={styles.requestDestination}>{currentRequest.destination}</Text>
            <View style={styles.requestMeta}>
              <Clock color="#6B7280" size={16} />
              <Text style={styles.requestTime}>
                Requested {new Date(currentRequest.timestamp).toLocaleTimeString()}
              </Text>
            </View>
          </View>
        )}

        <Text style={styles.matchesTitle}>Available Matches</Text>

        {matches.map((match) => (
          <View key={match.id} style={styles.matchCard}>
            <View style={styles.matchHeader}>
              <View style={styles.matchAvatarContainer}>
                <Text style={styles.matchAvatar}>{match.avatar}</Text>
                {match.isVerified && (
                  <View style={styles.verifiedBadge}>
                    <Shield color="white" size={12} />
                  </View>
                )}
              </View>
              <View style={styles.matchInfo}>
                <View style={styles.matchNameRow}>
                  <Text style={styles.matchName}>{match.name}</Text>
                  <TouchableOpacity
                    style={styles.rejectButton}
                    onPress={() => handleRejectMatch(match.id)}
                  >
                    <X color="#EF4444" size={16} />
                  </TouchableOpacity>
                </View>
                <View style={styles.matchRating}>
                  <Star color="#F59E0B" size={16} fill="#F59E0B" />
                  <Text style={styles.matchRatingText}>{match.rating}</Text>
                  <Text style={styles.matchDistance}>• {match.distance} away</Text>
                  <Text style={styles.matchRides}>• {match.totalRides} rides</Text>
                </View>
              </View>
              <View style={styles.matchPercentage}>
                <Text style={styles.matchPercentageText}>{match.matchPercentage}%</Text>
                <Text style={styles.matchPercentageLabel}>match</Text>
              </View>
            </View>

            <View style={styles.matchDestination}>
              <MapPin color="#6B7280" size={16} />
              <Text style={styles.matchDestinationText}>{match.destination}</Text>
            </View>

            <View style={styles.matchActions}>
              <TouchableOpacity 
                style={[
                  styles.actionButton,
                  !match.preferences.allowMessages && styles.actionButtonDisabled
                ]}
                onPress={() => handleStartChat(match)}
                disabled={!match.preferences.allowMessages}
              >
                <MessageCircle 
                  color={match.preferences.allowMessages ? "#3B82F6" : "#9CA3AF"} 
                  size={20} 
                />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.actionButton,
                  !match.preferences.allowCalls && styles.actionButtonDisabled
                ]}
                onPress={() => handleCall(match)}
                disabled={!match.preferences.allowCalls}
              >
                <Phone 
                  color={match.preferences.allowCalls ? "#10B981" : "#9CA3AF"} 
                  size={20} 
                />
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => handleBlockUser(match)}
              >
                <Ban color="#EF4444" size={20} />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.selectButton}
                onPress={() => handleSelectMatch(match)}
              >
                <LinearGradient 
                  colors={['#3B82F6', '#1E40AF']} 
                  style={styles.selectButtonGradient}
                >
                  <Text style={styles.selectButtonText}>Select Ride</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: '#6B7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    color: '#1F2937',
    marginTop: 16,
  },
  emptySubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 24,
  },
  backButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 24,
  },
  backButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: 'white',
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 32,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 28,
    color: 'white',
  },
  headerSubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  requestCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  requestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  requestTitle: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#3B82F6',
  },
  requestDestination: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: '#1F2937',
    marginBottom: 8,
  },
  requestMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  requestTime: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#6B7280',
  },
  matchesTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: '#1F2937',
    marginBottom: 16,
  },
  matchCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  matchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  matchAvatarContainer: {
    position: 'relative',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  matchAvatar: {
    fontSize: 24,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  matchInfo: {
    flex: 1,
  },
  matchNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  matchName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: '#1F2937',
  },
  rejectButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  matchRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  matchRatingText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#1F2937',
  },
  matchDistance: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#6B7280',
  },
  matchRides: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#6B7280',
  },
  matchPercentage: {
    alignItems: 'center',
  },
  matchPercentageText: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    color: '#10B981',
  },
  matchPercentageLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#6B7280',
  },
  matchDestination: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  matchDestinationText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#1F2937',
  },
  matchActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  selectButton: {
    flex: 1,
    marginLeft: 8,
  },
  selectButtonGradient: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  selectButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: 'white',
  },
});