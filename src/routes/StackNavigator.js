
import {
  createStaticNavigation,
  useNavigation,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BottomTabNavigator from './BottomTabNavigator'

const MyStack = createNativeStackNavigator({
  screens: {
    BottomTabs: BottomTabNavigator,
    // Home:Home
    // Profile: ProfileScreen,
  },
});

const Navigation = createStaticNavigation(MyStack);

export default function StackNavigator() {
  return <Navigation />;
}
