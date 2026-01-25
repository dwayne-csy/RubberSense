import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DashboardScreen from '../Screen/Admin/DashboardScreen'; // This should be Dashboard.js
import AdminProfileScreen from '../Screen/Admin/AdminProfileScreen';
import AdminUpdateProfileScreen from '../Screen/Admin/AdminUpdateProfileScreen';

const Stack = createNativeStackNavigator();

export default function AdminStack() {
  return (
    <Stack.Navigator initialRouteName="AdminDashboard">
      <Stack.Screen name="AdminDashboard" component={DashboardScreen} />
      <Stack.Screen name="AdminProfile" component={AdminProfileScreen} />
      <Stack.Screen name="AdminUpdateProfile" component={AdminUpdateProfileScreen} />
    </Stack.Navigator>
  );
}