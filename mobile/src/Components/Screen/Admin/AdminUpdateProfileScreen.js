import React, { useState } from 'react';
import { View, TextInput, Button, Alert, ScrollView } from 'react-native';
import axios from 'axios';
import { getToken } from '../../utils/helper';
import { BACKEND_URL } from '@env';

export default function AdminUpdateProfileScreen({ route, navigation }) {
  const { user } = route.params;
  const [name, setName] = useState(user?.name || '');
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const res = await axios.put(`${BACKEND_URL}/me/update`, { name }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      Alert.alert('Success', res.data.message);
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 20 }}>
      <TextInput placeholder="Name" value={name} onChangeText={setName} style={{ marginBottom: 10, borderWidth: 1, padding: 10 }} />
      <Button title={loading ? 'Updating...' : 'Update Profile'} onPress={handleUpdate} disabled={loading} />
    </ScrollView>
  );
}
