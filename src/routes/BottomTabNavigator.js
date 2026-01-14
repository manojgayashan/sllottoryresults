import * as React from 'react';
import { Text, View } from 'react-native';
import {
  createStaticNavigation,
  useNavigation,
} from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Home from '../screens/Home'


const MyTabs = createBottomTabNavigator({
  screens: {
    Home: Home,
  },
});

const Navigation = createStaticNavigation(MyTabs);

export default function BottomTabNavigator() {
  return <Navigation />;
}