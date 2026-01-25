import React, { useEffect, useState } from 'react';
import { View, Text, Button, Alert } from 'react-native';
import { getUser, getToken, logout } from '../../utils/helper';

export default function DashboardScreen({ navigation }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      const storedUser = await getUser();
      setUser(storedUser);
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    await logout(() => navigation.replace('Dashboard'));
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
      <Text style={{ fontSize: 20, marginBottom: 10 }}>Admin Dashboard</Text>
      <Text style={{ marginBottom: 20 }}>Welcome, {user?.name}</Text>
      <Button title="Profile" onPress={() => navigation.navigate('AdminProfile')} />
      <View style={{ height: 10 }} />
      <Button title="Logout" onPress={handleLogout} color="red" />
    </View>
  );
}
