import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import TeamScreen from '../screens/TeamScreen';
import PlayerDetailScreen from '../screens/PlayerDetailScreen';
import TeamEditorScreen from '../screens/TeamEditorScreen';
import TransferListScreen from '../screens/TransferListScreen';
import CreateTransferOfferScreen from '../screens/CreateTransferOfferScreen';
import SelectPlayerScreen from '../screens/SelectPlayerScreen';

export type CreateTransferOfferParams = {
  playerId: number;
  playerName: string;
  marketValue: string;
  country: string;
  position: string;
  age: number;
  birthDate: string;
};

export type TeamStackParamList = {
  TeamHome: undefined;
  PlayerDetail: { playerId: number; isOwnPlayer: boolean };
  TeamEditor: { teamName: string; teamCountry: string };
  CreateTransferOffer: CreateTransferOfferParams;
};

export type TransferStackParamList = {
  TransferListHome: undefined;
  PlayerDetail: { playerId: number; isOwnPlayer: boolean };
  SelectPlayer: undefined;
  CreateTransferOffer: CreateTransferOfferParams;
};

const Tab              = createBottomTabNavigator();
const TeamStackNav     = createStackNavigator<TeamStackParamList>();
const TransferStackNav = createStackNavigator<TransferStackParamList>();

function TeamStack() {
  return (
    <TeamStackNav.Navigator>
      <TeamStackNav.Screen
        name="TeamHome"
        component={TeamScreen}
        options={{ headerShown: false }}
      />
      <TeamStackNav.Screen
        name="PlayerDetail"
        component={PlayerDetailScreen}
        options={{ title: 'Player' }}
      />
      <TeamStackNav.Screen
        name="TeamEditor"
        component={TeamEditorScreen}
        options={{ title: 'Edit Team' }}
      />
      <TeamStackNav.Screen
        name="CreateTransferOffer"
        component={CreateTransferOfferScreen}
        options={{ title: 'List for Sale' }}
      />
    </TeamStackNav.Navigator>
  );
}

function TransferStack() {
  return (
    <TransferStackNav.Navigator>
      <TransferStackNav.Screen
        name="TransferListHome"
        component={TransferListScreen}
        options={{ title: 'Transfer Market' }}
      />
      <TransferStackNav.Screen
        name="PlayerDetail"
        component={PlayerDetailScreen}
        options={{ title: 'Player', headerBackTitle: 'Market' }}
      />
      <TransferStackNav.Screen
        name="SelectPlayer"
        component={SelectPlayerScreen}
        options={{ title: 'Select Player', headerBackTitle: 'Market' }}
      />
      <TransferStackNav.Screen
        name="CreateTransferOffer"
        component={CreateTransferOfferScreen}
        options={{ title: 'List for Sale', headerBackTitle: 'Select' }}
      />
    </TransferStackNav.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <Tab.Navigator>
      <Tab.Screen
        name="Team"
        component={TeamStack}
        options={{
          headerShown: false,
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'people' : 'people-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Transfer List"
        component={TransferStack}
        options={{
          headerShown: false,
          tabBarLabel: 'Market',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'storefront' : 'storefront-outline'} size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
