import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MapPin, Navigation, Users, Clock, Search, Settings, X } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';

export default function FindRideScreen() {
  const [destination, setDestination] = useState('');
  const [currentLocation, setCurrentLocation] = useState('Detecting location...');
  const [isSearching, setIsSearching] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const { user, updateUser } = useAuth();
  const { sendMatchNotification } = useNotifications();

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      if (Platform.OS === 'web') {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              setCurrentLocation(`${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`);
            },
            () => {
              setCurrentLocation('Location unavailable');
            }
          );
        } else {
          setCurrentLocation('Location unavailable');
        }
      } else {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setCurrentLocation('Location permission denied');
          return;
        }

        let location = await Location.getCurrentPositionAsync({});
        setCurrentLocation(`${location.coords.latitude.toFixed(4)}, ${location.coords.longitude.toFixed(4)}`);
      }
    } catch (error) {
      console.error('Error getting location:', error);
      setCurrentLocation('Location unavailable');
    }
  };

  const handleFindRide = async () => {
    if (!destination.trim()) {
      Alert.alert('Destination Required', 'Please enter your destination to find a ride.');
      return;
    }

    setIsSearching(true);

    setTimeout(async () => {
      try {
        const rideRequest = {
          id: Date.now().toString(),
          destination: destination.trim(),
          currentLocation,
          timestamp: new Date().toISOString(),
          status: 'searching',
          userId: user?.id,
        };

        await AsyncStorage.setItem('currentRideRequest', JSON.stringify(rideRequest));
        await generateMockMatches(rideRequest);
        
        setIsSearching(false);
        router.push('/matches');
      } catch (error) {
        console.error('Error saving ride request:', error);
        setIsSearching(false);
        Alert.alert('Error', 'Failed to search for rides. Please try again.');
      }
    }, 2000);
  };

  const generateMockMatches = async (rideRequest: any) => {
    const mockUsers = [
      { 
        id: 'user1',
        name: 'Sarah Chen', 
        rating: 4.8, 
        distance: '200m', 
        destination: 'Airport Terminal 2', 
        avatar: '👩‍💼',
        isVerified: true,
        totalRides: 45,
        phone: '+1234567890',
        preferences: { allowMessages: true, allowCalls: true }
      },
      { 
        id: 'user2',
        name: 'Mike Johnson', 
        rating: 4.9, 
        distance: '350m', 
        destination: 'Downtown Mall', 
        avatar: '👨‍💻',
        isVerified: true,
        totalRides: 32,
        phone: '+1234567891',
        preferences: { allowMessages: true, allowCalls: false }
      },
      { 
        id: 'user3',
        name: 'Emma Wilson', 
        rating: 4.7, 
        distance: '450m', 
        destination: 'Central Station', 
        avatar: '👩‍🎓',
        isVerified: false,
        totalRides: 18,
        phone: '+1234567892',
        preferences: { allowMessages: false, allowCalls: true }
      },
    ];

    // Filter out blocked users
    const filteredUsers = mockUsers.filter(mockUser => 
      !user?.blockedUsers.includes(mockUser.id)
    );

    const matches = filteredUsers.map((mockUser, index) => ({
      ...mockUser,
      rideRequestId: rideRequest.id,
      matchPercentage: Math.floor(Math.random() * 30) + 70,
    }));

    await AsyncStorage.setItem('currentMatches', JSON.stringify(matches));

    // Send notification for first match
    if (matches.length > 0) {
      await sendMatchNotification(matches[0].name, matches[0].destination);
    }
  };

  const updatePreference = async (key: string, value: any) => {
    if (!user) return;
    
    const updatedPreferences = { ...user.preferences, [key]: value };
    await updateUser({ preferences: updatedPreferences });
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#3B82F6', '#1E40AF']} style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>Hello, {user?.name}!</Text>
            <Text style={styles.headerSubtitle}>Where would you like to go?</Text>
          </View>
          <TouchableOpacity 
            style={styles.settingsButton}
            onPress={() => setShowPreferences(!showPreferences)}
          >
            {showPreferences ? (
              <X color="white" size={24} />
            ) : (
              <Settings color="white" size={24} />
            )}
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {showPreferences && (
        <View style={styles.preferencesPanel}>
          <Text style={styles.preferencesTitle}>Ride Preferences</Text>
          
          <View style={styles.preferenceItem}>
            <Text style={styles.preferenceLabel}>Max Distance: {user?.preferences.maxRideDistance}m</Text>
            <View style={styles.distanceButtons}>
              {[300, 500, 1000].map(distance => (
                <TouchableOpacity
                  key={distance}
                  style={[
                    styles.distanceButton,
                    user?.preferences.maxRideDistance === distance && styles.distanceButtonActive
                  ]}
                  onPress={() => updatePreference('maxRideDistance', distance)}
                >
                  <Text style={[
                    styles.distanceButtonText,
                    user?.preferences.maxRideDistance === distance && styles.distanceButtonTextActive
                  ]}>
                    {distance}m
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.preferenceItem}>
            <Text style={styles.preferenceLabel}>Gender Preference</Text>
            <View style={styles.genderButtons}>
              {[
                { key: 'any', label: 'Any' },
                { key: 'male', label: 'Male' },
                { key: 'female', label: 'Female' }
              ].map(option => (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.genderButton,
                    user?.preferences.preferredGender === option.key && styles.genderButtonActive
                  ]}
                  onPress={() => updatePreference('preferredGender', option.key)}
                >
                  <Text style={[
                    styles.genderButtonText,
                    user?.preferences.preferredGender === option.key && styles.genderButtonTextActive
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      )}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.locationCard}>
          <View style={styles.locationRow}>
            <Navigation color="#10B981" size={20} />
            <View style={styles.locationInfo}>
              <Text style={styles.locationLabel}>Current Location</Text>
              <Text style={styles.locationText}>{currentLocation}</Text>
            </View>
          </View>
        </View>

        <View style={styles.destinationCard}>
          <View style={styles.inputHeader}>
            <MapPin color="#3B82F6" size={20} />
            <Text style={styles.inputLabel}>Destination</Text>
          </View>
          <TextInput
            style={styles.destinationInput}
            placeholder="Where are you going?"
            placeholderTextColor="#9CA3AF"
            value={destination}
            onChangeText={setDestination}
            multiline={false}
            autoCapitalize="words"
          />
        </View>

        <TouchableOpacity 
          style={[styles.findButton, isSearching && styles.findButtonDisabled]} 
          onPress={handleFindRide}
          disabled={isSearching}
        >
          <LinearGradient 
            colors={isSearching ? ['#9CA3AF', '#6B7280'] : ['#3B82F6', '#1E40AF']} 
            style={styles.findButtonGradient}
          >
            {isSearching ? (
              <>
                <Search color="white" size={20} />
                <Text style={styles.findButtonText}>Searching for rides...</Text>
              </>
            ) : (
              <>
                <Users color="white" size={20} />
                <Text style={styles.findButtonText}>Find Shared Ride</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>How CabShare Works</Text>
          <View style={styles.infoCards}>
            <View style={styles.infoCard}>
              <MapPin color="#3B82F6" size={24} />
              <Text style={styles.infoCardTitle}>Smart Matching</Text>
              <Text style={styles.infoCardText}>Find verified users within your preferred distance heading to similar destinations</Text>
            </View>
            <View style={styles.infoCard}>
              <Users color="#10B981" size={24} />
              <Text style={styles.infoCardTitle}>Safe Sharing</Text>
              <Text style={styles.infoCardText}>Share with 1-3 verified users with ratings, reviews, and safety features</Text>
            </View>
            <View style={styles.infoCard}>
              <Clock color="#F59E0B" size={24} />
              <Text style={styles.infoCardTitle}>Real-time Updates</Text>
              <Text style={styles.infoCardText}>Get instant notifications and live tracking during your ride</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 32,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greeting: {
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
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  preferencesPanel: {
    backgroundColor: 'white',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  preferencesTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: '#1F2937',
    marginBottom: 16,
  },
  preferenceItem: {
    marginBottom: 16,
  },
  preferenceLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  distanceButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  distanceButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  distanceButtonActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  distanceButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: '#6B7280',
  },
  distanceButtonTextActive: {
    color: 'white',
  },
  genderButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  genderButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  genderButtonActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  genderButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: '#6B7280',
  },
  genderButtonTextActive: {
    color: 'white',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  locationCard: {
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
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  locationInfo: {
    flex: 1,
  },
  locationLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  locationText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#1F2937',
    marginTop: 2,
  },
  destinationCard: {
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
  inputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  inputLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#3B82F6',
  },
  destinationInput: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#1F2937',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  findButton: {
    marginBottom: 32,
  },
  findButtonDisabled: {
    opacity: 0.7,
  },
  findButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 18,
    borderRadius: 16,
  },
  findButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: 'white',
  },
  infoSection: {
    marginBottom: 32,
  },
  infoTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: '#1F2937',
    marginBottom: 16,
  },
  infoCards: {
    gap: 16,
  },
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  infoCardTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#1F2937',
    marginTop: 8,
    marginBottom: 4,
  },
  infoCardText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
});