import React, { useEffect, useState } from 'react';
import { View, Text, Button, Image, ActivityIndicator, ScrollView } from 'react-native';
import { getUser, getToken } from '../../utils/helper';
import axios from 'axios';
import { BACKEND_URL } from '@env';

export default function ProfileScreen({ navigation, route }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      const token = await getToken();
      if (!token) return navigation.replace('Login');

      try {
        const storedUser = await getUser();

        // If coming from UpdateProfileScreen with updated user
        if (route.params?.updatedUser) {
          setUser(route.params.updatedUser);
        } else {
          const res = await axios.get(`${BACKEND_URL}/api/v1/users/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setUser(res.data.user || storedUser);
        }
      } catch (error) {
        console.error('Fetch profile error:', error.response?.data || error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [route.params?.updatedUser]);

  if (loading)
    return (
      <ActivityIndicator
        size="large"
        style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
      />
    );

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 20 }}>
      <View style={{ alignItems: 'center', marginBottom: 20 }}>
        <Image
          source={{ uri: user?.avatar?.url }}
          style={{ width: 100, height: 100, borderRadius: 50 }}
        />
      </View>
      <Text style={{ marginBottom: 10 }}>Full Name: {user?.name || '-'}</Text>
      <Text style={{ marginBottom: 10 }}>Email: {user?.email || '-'}</Text>
      <Text style={{ marginBottom: 10 }}>Contact: {user?.contact || '-'}</Text>
      <Text style={{ marginBottom: 10 }}>City: {user?.address?.city || '-'}</Text>
      <Text style={{ marginBottom: 10 }}>Barangay: {user?.address?.barangay || '-'}</Text>
      <Text style={{ marginBottom: 10 }}>Street: {user?.address?.street || '-'}</Text>
      <Text style={{ marginBottom: 10 }}>Zip Code: {user?.address?.zipcode || '-'}</Text>

      {/* Change Password Button */}
      <View style={{ marginBottom: 10 }}>
        <Button
          title="Change Password"
          onPress={() => navigation.navigate('ChangePassword')}
          color="#ff6b6b"
        />
      </View>

      {/* Update Profile Button */}
      <Button
        title="Update Profile"
        onPress={() => navigation.navigate('UpdateProfile', { user })}
        color="#007bff"
      />
    </ScrollView>
  );
}
