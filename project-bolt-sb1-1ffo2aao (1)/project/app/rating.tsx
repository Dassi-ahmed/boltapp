import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Star, MessageSquare, Check } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

interface PendingRating {
  rideId: string;
  partnerName: string;
}

export default function RatingScreen() {
  const [pendingRating, setPendingRating] = useState<PendingRating | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadPendingRating();
  }, []);

  const loadPendingRating = async () => {
    try {
      const pendingData = await AsyncStorage.getItem('pendingRating');
      if (pendingData) {
        setPendingRating(JSON.parse(pendingData));
      } else {
        // No pending rating, redirect to tabs
        router.replace('/(tabs)');
      }
    } catch (error) {
      console.error('Error loading pending rating:', error);
      router.replace('/(tabs)');
    }
  };

  const handleRatingSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please select a rating before submitting.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Update ride history with rating
      const userProfileData = await AsyncStorage.getItem('userProfile');
      if (userProfileData && pendingRating) {
        const userProfile = JSON.parse(userProfileData);
        
        // Find and update the ride in history
        const rideIndex = userProfile.rideHistory.findIndex(
          (ride: any) => ride.id === pendingRating.rideId
        );
        
        if (rideIndex !== -1) {
          userProfile.rideHistory[rideIndex].userRating = rating;
          userProfile.rideHistory[rideIndex].comment = comment;
          
          // Update overall user rating (simple average for demo)
          const allRatings = userProfile.rideHistory
            .filter((ride: any) => ride.userRating)
            .map((ride: any) => ride.userRating);
          
          if (allRatings.length > 0) {
            userProfile.rating = allRatings.reduce((sum: number, r: number) => sum + r, 0) / allRatings.length;
          }
          
          await AsyncStorage.setItem('userProfile', JSON.stringify(userProfile));
        }
      }

      // Clear pending rating
      await AsyncStorage.removeItem('pendingRating');

      Alert.alert(
        'Thank You!',
        'Your rating has been submitted. Thank you for using CabShare!',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/(tabs)'),
          },
        ]
      );
    } catch (error) {
      console.error('Error submitting rating:', error);
      Alert.alert('Error', 'Failed to submit rating. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    Alert.alert(
      'Skip Rating?',
      'You can always rate your ride experience later from your history.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Skip',
          onPress: async () => {
            await AsyncStorage.removeItem('pendingRating');
            router.replace('/(tabs)');
          },
        },
      ]
    );
  };

  if (!pendingRating) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#3B82F6', '#1E40AF']} style={styles.header}>
        <Text style={styles.headerTitle}>Rate Your Experience</Text>
        <Text style={styles.headerSubtitle}>
          How was your ride with {pendingRating.partnerName}?
        </Text>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.ratingSection}>
          <Text style={styles.ratingLabel}>Tap to rate your experience</Text>
          <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => setRating(star)}
                style={styles.starButton}
              >
                <Star
                  color={star <= rating ? '#F59E0B' : '#E5E7EB'}
                  size={40}
                  fill={star <= rating ? '#F59E0B' : '#E5E7EB'}
                />
              </TouchableOpacity>
            ))}
          </View>
          {rating > 0 && (
            <Text style={styles.ratingText}>
              {rating === 1 && 'Poor'}
              {rating === 2 && 'Fair'}
              {rating === 3 && 'Good'}
              {rating === 4 && 'Very Good'}
              {rating === 5 && 'Excellent'}
            </Text>
          )}
        </View>

        <View style={styles.commentSection}>
          <View style={styles.commentHeader}>
            <MessageSquare color="#6B7280" size={20} />
            <Text style={styles.commentLabel}>Add a comment (optional)</Text>
          </View>
          <TextInput
            style={styles.commentInput}
            placeholder="Share your experience..."
            placeholderTextColor="#9CA3AF"
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={4}
            maxLength={200}
          />
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.submitButton, rating === 0 && styles.submitButtonDisabled]}
            onPress={handleRatingSubmit}
            disabled={rating === 0 || isSubmitting}
          >
            <LinearGradient
              colors={rating === 0 ? ['#9CA3AF', '#6B7280'] : ['#3B82F6', '#1E40AF']}
              style={styles.submitButtonGradient}
            >
              <Check color="white" size={20} />
              <Text style={styles.submitButtonText}>
                {isSubmitting ? 'Submitting...' : 'Submit Rating'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipButtonText}>Skip for now</Text>
          </TouchableOpacity>
        </View>
      </View>
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
  header: {
    paddingHorizontal: 24,
    paddingVertical: 48,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 28,
    color: 'white',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginTop: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  ratingSection: {
    alignItems: 'center',
    marginBottom: 48,
  },
  ratingLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 24,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  starButton: {
    padding: 4,
  },
  ratingText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: '#1F2937',
  },
  commentSection: {
    marginBottom: 48,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  commentLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#6B7280',
  },
  commentInput: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#1F2937',
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minHeight: 100,
  },
  buttonContainer: {
    gap: 16,
  },
  submitButton: {
    borderRadius: 16,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 18,
    borderRadius: 16,
  },
  submitButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: 'white',
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  skipButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: '#6B7280',
  },
});