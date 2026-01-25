import React, { useEffect, useState } from 'react';
import { View, Text, Button, Alert } from 'react-native';
import axios from 'axios';
import { getToken, logout, getUser } from '../../utils/helper';
import { BACKEND_URL } from '@env';

export default function HomeScreen({ navigation }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      const token = await getToken();
      if (!token) {
        // If no token, navigate to Login
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
        return;
      }

      const storedUser = await getUser();
      setUser(storedUser);
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    // Clear the token and user data
    await logout();
    
    // IMPORTANT: Reset navigation to Login screen
    // Since we're in UserStack, we need to reset to Login
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
      <Text style={{ fontSize: 20, marginBottom: 10 }}>Welcome, {user?.name || 'User'}!</Text>
      <Button title="Profile" onPress={() => navigation.navigate('Profile')} />
      <View style={{ height: 10 }} />
      <Button title="Logout" onPress={handleLogout} color="red" />
    </View>
  );
}