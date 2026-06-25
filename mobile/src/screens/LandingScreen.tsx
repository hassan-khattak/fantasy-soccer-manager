import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../navigation/AuthNavigator';

type Props = {
  navigation: StackNavigationProp<AuthStackParamList, 'Landing'>;
};

export default function LandingScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Fantasy Soccer</Text>
      <Text style={styles.subtitle}>Build your dream team</Text>
      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('SignIn')}>
        <Text style={styles.buttonText}>Sign In</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.button, styles.secondary]}
        onPress={() => navigation.navigate('Register')}
      >
        <Text style={styles.buttonText}>Register</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  title: { fontSize: 36, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#6b7280', marginBottom: 48 },
  button: {
    width: '100%',
    padding: 16,
    backgroundColor: '#2563eb',
    borderRadius: 8,
    marginBottom: 12,
  },
  secondary: { backgroundColor: '#6b7280' },
  buttonText: { color: '#fff', textAlign: 'center', fontWeight: '600', fontSize: 16 },
});
