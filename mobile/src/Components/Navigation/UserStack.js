import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../Screen/User/LoginScreen';
import RegisterScreen from '../Screen/User/RegisterScreen';
import HomeScreen from '../Screen/User/HomeScreen';
import ProfileScreen from '../Screen/User/ProfileScreen';
import UpdateProfileScreen from '../Screen/User/UpdateProfileScreen';

const Stack = createNativeStackNavigator();

export default function UserStack() {
  return (
    <Stack.Navigator initialRouteName="Login">
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="UpdateProfile" component={UpdateProfileScreen} />
    </Stack.Navigator>
  );
}
