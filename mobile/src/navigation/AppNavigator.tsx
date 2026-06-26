import React from 'react';
import { View, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import TeamScreen from '../screens/TeamScreen';
import PlayerDetailScreen from '../screens/PlayerDetailScreen';

export type TeamStackParamList = {
  TeamHome: undefined;
  PlayerDetail: { playerId: number };
};

const Tab   = createBottomTabNavigator();
const Stack = createStackNavigator<TeamStackParamList>();

function TeamStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="TeamHome"
        component={TeamScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="PlayerDetail"
        component={PlayerDetailScreen}
        options={{ title: 'Player' }}
      />
    </Stack.Navigator>
  );
}

function TransferListStub() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: '#999', fontSize: 15 }}>Transfer Market — coming in Slice 4</Text>
    </View>
  );
}

export default function AppNavigator() {
  return (
    <Tab.Navigator>
      <Tab.Screen
        name="Team"
        component={TeamStack}
        options={{ headerShown: false }}
      />
      <Tab.Screen
        name="Transfer List"
        component={TransferListStub}
      />
    </Tab.Navigator>
  );
}
