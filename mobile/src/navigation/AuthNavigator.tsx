import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import LandingScreen from '../screens/LandingScreen';
import SignInScreen from '../screens/SignInScreen';
import RegisterScreen from '../screens/RegisterScreen';

export type AuthStackParamList = {
  Landing: undefined;
  SignIn: undefined;
  Register: undefined;
};

const Stack = createStackNavigator<AuthStackParamList>();

export default function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Landing" component={LandingScreen} />
      <Stack.Screen
        name="SignIn"
        component={SignInScreen}
        options={{ headerShown: true, title: 'Sign In', headerBackTitle: 'Back' }}
      />
      <Stack.Screen
        name="Register"
        component={RegisterScreen}
        options={{ headerShown: true, title: 'Create Account', headerBackTitle: 'Back' }}
      />
    </Stack.Navigator>
  );
}
