import React, { useEffect, useState } from 'react';
import { View, Text, Button, Image, ActivityIndicator, ScrollView } from 'react-native';
import axios from 'axios';
import { getToken } from '../../utils/helper';
import { BACKEND_URL } from '@env';

export default function AdminProfileScreen({ navigation, route }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Handle updated user from update screen
  useEffect(() => {
    if (route.params?.updatedUser) {
      setUser(route.params.updatedUser);
    }
  }, [route.params?.updatedUser]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = await getToken();
        const res = await axios.get(`${BACKEND_URL}/me`, {
          headers: { Authorization: `Bearer ${token}` },
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

  if (loading)
    return (
      <ActivityIndicator
        size="large"
        style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
      />
    );

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 20 }}>
      {/* Avatar */}
      <View style={{ alignItems: 'center', marginBottom: 20 }}>
        <Image
          source={{
            uri: user?.avatar ? (user.avatar.url || user.avatar) : 'https://via.placeholder.com/100',
          }}
          style={{ width: 100, height: 100, borderRadius: 50 }}
        />
      </View>

      {/* Profile Fields */}
      <Text style={{ marginBottom: 10 }}>Full Name: {user?.name || '-'}</Text>
      <Text style={{ marginBottom: 10 }}>Email: {user?.email || '-'}</Text>
      <Text style={{ marginBottom: 10 }}>Contact: {user?.contact || '-'}</Text>
      <Text style={{ marginBottom: 10 }}>City: {user?.address?.city || '-'}</Text>
      <Text style={{ marginBottom: 10 }}>Barangay: {user?.address?.barangay || '-'}</Text>
      <Text style={{ marginBottom: 10 }}>Street: {user?.address?.street || '-'}</Text>
      <Text style={{ marginBottom: 10 }}>Zip Code: {user?.address?.zipcode || '-'}</Text>
      <Text style={{ marginBottom: 10 }}>Role: {user?.role || '-'}</Text>

      <Button
        title="Update Profile"
        onPress={() => navigation.navigate('AdminUpdateProfile', { user })}
      />
    </ScrollView>
  );
}
