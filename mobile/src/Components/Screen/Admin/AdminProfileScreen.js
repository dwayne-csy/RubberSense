import React, { useEffect, useState } from 'react';
import { View, Text, Button, Image, ActivityIndicator } from 'react-native';
import axios from 'axios';
import { getToken } from '../../utils/helper';
import { BACKEND_URL } from '@env';

export default function AdminProfileScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = await getToken();
        const res = await axios.get(`${BACKEND_URL}/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUser(res.data.user);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading) return <ActivityIndicator size="large" style={{ flex: 1 }} />;

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Image source={{ uri: user?.avatar?.url }} style={{ width: 100, height: 100, borderRadius: 50, marginBottom: 20 }} />
      <Text>Name: {user?.name}</Text>
      <Text>Email: {user?.email}</Text>
      <Text>Role: {user?.role}</Text>
      <Button title="Update Profile" onPress={() => navigation.navigate('AdminUpdateProfile', { user })} />
    </View>
  );
}
