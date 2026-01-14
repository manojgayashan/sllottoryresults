import * as React from 'react';
import { StatusBar, Text, View } from 'react-native';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Home from '../screens/Home'
import Lotteries from '../screens/Lotteries'
import WebViewer from '../screens/WebViewer'
import QR from '../screens/QR'
import Octicons from 'react-native-vector-icons/Octicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import colors from '../constants/colors'

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function HomeTabs() {
  return (
    <Tab.Navigator screenOptions={{headerShown:false,tabBarActiveTintColor:colors.primary}}>
      <Tab.Screen name="Home" component={Home} options={
        {
          tabBarIcon:({focused,color})=><Octicons name="home" size={30} color={color} />
        }
      } />
      <Tab.Screen name="qr" component={QR}
      options={
        {
          tabBarIcon:({focused,color})=><MaterialIcons name="qr-code" size={30} color={color} />,
          title:'Scan QR'
        }
      } />

    </Tab.Navigator>
  );
}

function RootStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="home"
        component={HomeTabs}
      />
      <Stack.Screen
        name="lotteries"
        component={Lotteries}
      />
      <Stack.Screen
        name="webviewer"
        component={WebViewer}
      />
      {/* <Stack.Screen name="qr" component={QR} /> */}
    </Stack.Navigator>
  );
}

export default function MainRoute() {
  return (
    <NavigationContainer>
      <StatusBar barStyle={'dark-content'} backgroundColor={colors.white} />
      <RootStack />
    </NavigationContainer>
  );
}
