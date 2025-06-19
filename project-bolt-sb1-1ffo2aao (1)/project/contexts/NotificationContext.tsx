import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

interface NotificationContextType {
  expoPushToken: string | null;
  notification: Notifications.Notification | null;
  sendMatchNotification: (matchName: string, destination: string) => Promise<void>;
  sendRideUpdateNotification: (message: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);

  useEffect(() => {
    registerForPushNotificationsAsync();

    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      setNotification(notification);
    });

    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
    });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener);
      Notifications.removeNotificationSubscription(responseListener);
    };
  }, []);

  const registerForPushNotificationsAsync = async () => {
    if (Platform.OS === 'web') {
      // Web doesn't support push notifications in the same way
      return;
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return;
      }
      
      const token = await Notifications.getExpoPushTokenAsync();
      setExpoPushToken(token.data);
    } catch (error) {
      console.error('Error getting push token:', error);
    }
  };

  const sendMatchNotification = async (matchName: string, destination: string) => {
    if (Platform.OS === 'web') {
      // For web, we'll show a browser notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('New Ride Match!', {
          body: `${matchName} is heading to ${destination}`,
          icon: '/assets/images/icon.png',
        });
      }
      return;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'New Ride Match! 🚗',
        body: `${matchName} is heading to ${destination}`,
        data: { type: 'match', matchName, destination },
      },
      trigger: null,
    });
  };

  const sendRideUpdateNotification = async (message: string) => {
    if (Platform.OS === 'web') {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Ride Update', {
          body: message,
          icon: '/assets/images/icon.png',
        });
      }
      return;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Ride Update',
        body: message,
        data: { type: 'ride_update' },
      },
      trigger: null,
    });
  };

  return (
    <NotificationContext.Provider value={{
      expoPushToken,
      notification,
      sendMatchNotification,
      sendRideUpdateNotification,
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}