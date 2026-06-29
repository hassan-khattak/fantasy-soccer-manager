import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import TeamScreen from '../screens/TeamScreen';
import PlayerDetailScreen from '../screens/PlayerDetailScreen';
import TeamEditorScreen from '../screens/TeamEditorScreen';
import TransferListScreen from '../screens/TransferListScreen';
import CreateTransferOfferScreen from '../screens/CreateTransferOfferScreen';

export type TeamStackParamList = {
  TeamHome: undefined;
  PlayerDetail: { playerId: number; isOwnPlayer: boolean };
  TeamEditor: { teamName: string; teamCountry: string };
  CreateTransferOffer: { playerId: number; playerName: string };
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
      <Stack.Screen
        name="TeamEditor"
        component={TeamEditorScreen}
        options={{ title: 'Edit Team' }}
      />
      <Stack.Screen
        name="CreateTransferOffer"
        component={CreateTransferOfferScreen}
        options={{ title: 'List for Sale' }}
      />
    </Stack.Navigator>
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
        component={TransferListScreen}
        options={{ headerShown: true, title: 'Transfer Market' }}
      />
    </Tab.Navigator>
  );
}
