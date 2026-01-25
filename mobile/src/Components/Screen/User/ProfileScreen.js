import React, { useEffect, useState } from 'react';
import { View, Text, Button, Image, ActivityIndicator } from 'react-native';
import { getUser, getToken } from '../../utils/helper';
import axios from 'axios';
import { BACKEND_URL } from '@env';

export default function ProfileScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      const token = await getToken();
      if (!token) return navigation.replace('Login');

      try {
        const storedUser = await getUser();
        const res = await axios.get(`${BACKEND_URL}/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUser(res.data.user || storedUser);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading) return <ActivityIndicator size="large" style={{ flex: 1, justifyContent: 'center' }} />;

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Image source={{ uri: user?.avatar?.url }} style={{ width: 100, height: 100, borderRadius: 50, marginBottom: 20 }} />
      <Text>Name: {user?.name}</Text>
      <Text>Email: {user?.email}</Text>
      <Text>Contact: {user?.contact || 'N/A'}</Text>
      <Text>City: {user?.address?.city || 'N/A'}</Text>
      <Button title="Update Profile" onPress={() => navigation.navigate('UpdateProfile', { user })} />
    </View>
  );
}
