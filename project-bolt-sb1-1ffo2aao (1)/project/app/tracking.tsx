import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, MapPin, Navigation, Phone, MessageCircle, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle } from 'lucide-react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNotifications } from '@/contexts/NotificationContext';

const { width } = Dimensions.get('window');

interface ActiveRide {
  id: string;
  partnerName: string;
  partnerPhone: string;
  partnerAvatar: string;
  destination: string;
  status: string;
}

export default function TrackingScreen() {
  const [activeRide, setActiveRide] = useState<ActiveRide | null>(null);
  const [rideStatus, setRideStatus] = useState<'waiting' | 'pickup' | 'enroute' | 'arrived'>('waiting');
  const [estimatedTime, setEstimatedTime] = useState(15);
  const [currentLocation, setCurrentLocation] = useState('Loading...');
  const { sendRideUpdateNotification } = useNotifications();

  useEffect(() => {
    loadActiveRide();
    startLocationTracking();
    simulateRideProgress();
  }, []);

  const loadActiveRide = async () => {
    try {
      const rideData = await AsyncStorage.getItem('activeRide');
      if (rideData) {
        setActiveRide(JSON.parse(rideData));
      } else {
        router.back();
      }
    } catch (error) {
      console.error('Error loading active ride:', error);
      router.back();
    }
  };

  const startLocationTracking = () => {
    // Mock location updates
    const locations = [
      'Main Street & 1st Ave',
      'Downtown Plaza',
      'City Center',
      'Airport Highway',
      'Terminal Approach',
    ];

    let locationIndex = 0;
    const locationInterval = setInterval(() => {
      if (locationIndex < locations.length) {
        setCurrentLocation(locations[locationIndex]);
        locationIndex++;
      } else {
        clearInterval(locationInterval);
      }
    }, 3000);

    return () => clearInterval(locationInterval);
  };

  const simulateRideProgress = () => {
    const statusProgression = [
      { status: 'pickup', time: 5000, eta: 12, message: 'Driver is on the way to pick you up' },
      { status: 'enroute', time: 10000, eta: 8, message: 'You are now en route to your destination' },
      { status: 'arrived', time: 15000, eta: 0, message: 'You have arrived at your destination' },
    ];

    statusProgression.forEach(({ status, time, eta, message }) => {
      setTimeout(async () => {
        setRideStatus(status as any);
        setEstimatedTime(eta);
        await sendRideUpdateNotification(message);
      }, time);
    });
  };

  const handleEmergency = () => {
    Alert.alert(
      'Emergency',
      'Are you in an emergency situation?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call Emergency',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Emergency Services', 'Calling emergency services...');
          },
        },
      ]
    );
  };

  const handleCompleteRide = async () => {
    try {
      // Update ride status to completed
      if (activeRide) {
        const completedRide = {
          ...activeRide,
          status: 'completed',
          completedAt: new Date().toISOString(),
        };

        // Store for rating
        await AsyncStorage.setItem('pendingRating', JSON.stringify({
          rideId: completedRide.id,
          partnerName: completedRide.partnerName,
        }));

        // Clear active ride
        await AsyncStorage.removeItem('activeRide');

        router.replace('/rating');
      }
    } catch (error) {
      console.error('Error completing ride:', error);
    }
  };

  const getStatusInfo = () => {
    switch (rideStatus) {
      case 'waiting':
        return {
          title: 'Waiting for Pickup',
          subtitle: 'Your ride partner is on the way',
          color: '#F59E0B',
          icon: <Navigation color="#F59E0B" size={24} />,
        };
      case 'pickup':
        return {
          title: 'Pickup in Progress',
          subtitle: 'Meeting your ride partner',
          color: '#3B82F6',
          icon: <MapPin color="#3B82F6" size={24} />,
        };
      case 'enroute':
        return {
          title: 'En Route',
          subtitle: 'Heading to destination',
          color: '#10B981',
          icon: <Navigation color="#10B981" size={24} />,
        };
      case 'arrived':
        return {
          title: 'Arrived',
          subtitle: 'You have reached your destination',
          color: '#10B981',
          icon: <CheckCircle color="#10B981" size={24} />,
        };
      default:
        return {
          title: 'Unknown Status',
          subtitle: '',
          color: '#6B7280',
          icon: <MapPin color="#6B7280" size={24} />,
        };
    }
  };

  if (!activeRide) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading ride details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const statusInfo = getStatusInfo();

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
          <Text style={styles.headerTitle}>Live Tracking</Text>
          <TouchableOpacity 
            style={styles.emergencyButton}
            onPress={handleEmergency}
          >
            <AlertTriangle color="white" size={20} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        {/* Map Placeholder */}
        <View style={styles.mapContainer}>
          <LinearGradient 
            colors={['#E5E7EB', '#F3F4F6']} 
            style={styles.mapPlaceholder}
          >
            <MapPin color="#6B7280" size={48} />
            <Text style={styles.mapText}>Live Map View</Text>
            <Text style={styles.mapSubtext}>Real-time location tracking</Text>
          </LinearGradient>
        </View>

        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            {statusInfo.icon}
            <View style={styles.statusInfo}>
              <Text style={styles.statusTitle}>{statusInfo.title}</Text>
              <Text style={styles.statusSubtitle}>{statusInfo.subtitle}</Text>
            </View>
            {estimatedTime > 0 && (
              <View style={styles.etaContainer}>
                <Text style={styles.etaTime}>{estimatedTime}</Text>
                <Text style={styles.etaLabel}>min</Text>
              </View>
            )}
          </View>
          
          <View style={styles.locationInfo}>
            <MapPin color="#6B7280" size={16} />
            <Text style={styles.currentLocation}>{currentLocation}</Text>
          </View>
        </View>

        {/* Partner Info */}
        <View style={styles.partnerCard}>
          <View style={styles.partnerHeader}>
            <View style={styles.partnerAvatar}>
              <Text style={styles.avatarText}>{activeRide.partnerAvatar}</Text>
            </View>
            <View style={styles.partnerInfo}>
              <Text style={styles.partnerName}>{activeRide.partnerName}</Text>
              <Text style={styles.partnerDestination}>To: {activeRide.destination}</Text>
            </View>
          </View>

          <View style={styles.partnerActions}>
            <TouchableOpacity style={styles.actionButton}>
              <MessageCircle color="#3B82F6" size={20} />
              <Text style={styles.actionButtonText}>Message</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Phone color="#10B981" size={20} />
              <Text style={styles.actionButtonText}>Call</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Complete Ride Button */}
        {rideStatus === 'arrived' && (
          <TouchableOpacity 
            style={styles.completeButton}
            onPress={handleCompleteRide}
          >
            <LinearGradient 
              colors={['#10B981', '#059669']} 
              style={styles.completeButtonGradient}
            >
              <CheckCircle color="white" size={20} />
              <Text style={styles.completeButtonText}>Complete Ride</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
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
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: 'white',
  },
  emergencyButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  mapContainer: {
    height: 250,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapText: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: '#6B7280',
    marginTop: 8,
  },
  mapSubtext: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
  },
  statusCard: {
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
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusInfo: {
    flex: 1,
    marginLeft: 12,
  },
  statusTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: '#1F2937',
  },
  statusSubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  etaContainer: {
    alignItems: 'center',
  },
  etaTime: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    color: '#3B82F6',
  },
  etaLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#6B7280',
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  currentLocation: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#1F2937',
  },
  partnerCard: {
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
  partnerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  partnerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 24,
  },
  partnerInfo: {
    flex: 1,
  },
  partnerName: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: '#1F2937',
  },
  partnerDestination: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  partnerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  actionButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#1F2937',
  },
  completeButton: {
    marginTop: 'auto',
  },
  completeButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
  },
  completeButtonText: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: 'white',
  },
});