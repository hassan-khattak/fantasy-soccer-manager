import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import AuthNavigator from './AuthNavigator';
import AppNavigator from './AppNavigator';

export default function RootNavigator() {
  const { accessToken, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return accessToken ? <AppNavigator /> : <AuthNavigator />;
}
