import React, { useState }  from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Heart, Coffee, Gift, Star, CreditCard } from 'lucide-react-native';
import { router } from 'expo-router';

const donationAmounts = [
  { amount: 3, label: 'Coffee', icon: '☕', description: 'Buy me a coffee' },
  { amount: 5, label: 'Snack', icon: '🍪', description: 'A small treat' },
  { amount: 10, label: 'Lunch', icon: '🍕', description: 'Support development' },
  { amount: 25, label: 'Dinner', icon: '🍽️', description: 'Generous support' },
  { amount: 50, label: 'Premium', icon: '⭐', description: 'Amazing support!' },
  { amount: 100, label: 'Sponsor', icon: '🚀', description: 'Become a sponsor' },
];

export default function DonationScreen() {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleDonation = async () => {
    if (!selectedAmount) {
      Alert.alert('Select Amount', 'Please select a donation amount.');
      return;
    }

    setIsProcessing(true);

    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false);
      Alert.alert(
        'Thank You! ❤️',
        `Your $${selectedAmount} donation helps keep CabShare running and improving. We truly appreciate your support!`,
        [
          {
            text: 'You\'re Welcome!',
            onPress: () => router.back(),
          },
        ]
      );
    }, 2000);
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#EF4444', '#DC2626']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft color="white" size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Support CabShare</Text>
          <View style={styles.placeholder} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroSection}>
          <Heart color="#EF4444" size={64} />
          <Text style={styles.heroTitle}>Help Keep CabShare Free</Text>
          <Text style={styles.heroSubtitle}>
            Your support helps us maintain servers, add new features, and keep CabShare completely free for everyone.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Choose Your Support Level</Text>
          <View style={styles.donationGrid}>
            {donationAmounts.map((donation) => (
              <TouchableOpacity
                key={donation.amount}
                style={[
                  styles.donationCard,
                  selectedAmount === donation.amount && styles.donationCardSelected,
                ]}
                onPress={() => setSelectedAmount(donation.amount)}
              >
                <Text style={styles.donationIcon}>{donation.icon}</Text>
                <Text style={styles.donationAmount}>${donation.amount}</Text>
                <Text style={styles.donationLabel}>{donation.label}</Text>
                <Text style={styles.donationDescription}>{donation.description}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What Your Support Enables</Text>
          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <Star color="#F59E0B" size={20} />
              <Text style={styles.featureText}>Server costs and maintenance</Text>
            </View>
            <View style={styles.featureItem}>
              <Gift color="#10B981" size={20} />
              <Text style={styles.featureText}>New features and improvements</Text>
            </View>
            <View style={styles.featureItem}>
              <Coffee color="#8B5CF6" size={20} />
              <Text style={styles.featureText}>Developer motivation (coffee!)</Text>
            </View>
            <View style={styles.featureItem}>
              <Heart color="#EF4444" size={20} />
              <Text style={styles.featureText}>Keeping the app completely free</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About the Developer</Text>
          <View style={styles.developerCard}>
            <Text style={styles.developerText}>
              Hi! I'm an independent developer who created CabShare to help people save money and reduce their environmental impact. 
              Your support means the world to me and helps keep this project alive and growing.
            </Text>
            <Text style={styles.developerSignature}>- The CabShare Team 💙</Text>
          </View>
        </View>

        {selectedAmount && (
          <TouchableOpacity 
            style={[styles.donateButton, isProcessing && styles.donateButtonDisabled]}
            onPress={handleDonation}
            disabled={isProcessing}
          >
            <LinearGradient 
              colors={isProcessing ? ['#9CA3AF', '#6B7280'] : ['#EF4444', '#DC2626']} 
              style={styles.donateButtonGradient}
            >
              <CreditCard color="white" size={20} />
              <Text style={styles.donateButtonText}>
                {isProcessing ? 'Processing...' : `Donate $${selectedAmount}`}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        <Text style={styles.disclaimer}>
          This is a demo app. No actual payment will be processed. In a real app, this would integrate with payment providers like Stripe or PayPal.
        </Text>
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
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  heroTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 28,
    color: '#1F2937',
    marginTop: 16,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: '#1F2937',
    marginBottom: 16,
  },
  donationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  donationCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  donationCardSelected: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  donationIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  donationAmount: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    color: '#1F2937',
  },
  donationLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#EF4444',
    marginTop: 4,
  },
  donationDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
  },
  featuresList: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  featureText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#1F2937',
  },
  developerCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  developerText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#1F2937',
    lineHeight: 24,
    marginBottom: 12,
  },
  developerSignature: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'right',
  },
  donateButton: {
    marginBottom: 16,
  },
  donateButtonDisabled: {
    opacity: 0.7,
  },
  donateButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
  },
  donateButtonText: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: 'white',
  },
  disclaimer: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 18,
  },
});