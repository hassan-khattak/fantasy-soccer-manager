import React from 'react';
import { Text, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

const Tab = createBottomTabNavigator();

function TeamScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Team Screen coming in Slice 2</Text>
    </View>
  );
}

export default function AppNavigator() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Team" component={TeamScreen} />
    </Tab.Navigator>
  );
}
