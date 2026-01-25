import React, { useState } from 'react';
import { View, TextInput, Button, Alert, ScrollView, Text, Image, TouchableOpacity } from 'react-native';
import axios from 'axios';
import { getToken } from '../../utils/helper';
import { BACKEND_URL } from '@env';
import * as ImagePicker from 'expo-image-picker';

export default function AdminUpdateProfileScreen({ route, navigation }) {
  const { user } = route.params;

  const [name, setName] = useState(user?.name || '');
  const [contact, setContact] = useState(user?.contact || '');
  const [city, setCity] = useState(user?.address?.city || '');
  const [barangay, setBarangay] = useState(user?.address?.barangay || '');
  const [street, setStreet] = useState(user?.address?.street || '');
  const [zipcode, setZipcode] = useState(user?.address?.zipcode || '');
  const [avatar, setAvatar] = useState(user?.avatar?.url || user?.avatar || null);
  const [loading, setLoading] = useState(false);

  const pickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Permission to access gallery is required!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.5,
    });

    if (!result.canceled) {
      setAvatar(result.assets[0].uri);
    }
  };

  const handleUpdate = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const formData = new FormData();

      formData.append('name', name);
      formData.append('contact', contact);
      formData.append('city', city);
      formData.append('barangay', barangay);
      formData.append('street', street);
      formData.append('zipcode', zipcode);

      if (avatar && avatar !== (user?.avatar?.url || user?.avatar)) {
        const filename = avatar.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image';
        formData.append('avatar', { uri: avatar, name: filename, type });
      }

      const res = await axios.put(`${BACKEND_URL}/me/update`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      Alert.alert('Success', res.data.message || 'Profile updated successfully');
      navigation.navigate('AdminProfile', { updatedUser: res.data.user });
    } catch (error) {
      console.error(error.response?.data || error.message);
      Alert.alert('Error', error.response?.data?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 20 }}>
      <View style={{ alignItems: 'center', marginBottom: 20 }}>
        <TouchableOpacity onPress={pickAvatar}>
          {avatar ? (
            <Image
              source={{ uri: avatar }}
              style={{ width: 100, height: 100, borderRadius: 50 }}
            />
          ) : (
            <View
              style={{
                width: 100,
                height: 100,
                borderRadius: 50,
                backgroundColor: '#ccc',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Text>Pick Avatar</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <Text>Email (cannot update):</Text>
      <TextInput
        value={user?.email || ''}
        editable={false}
        style={{ marginBottom: 10, borderWidth: 1, padding: 10, backgroundColor: '#eee' }}
      />

      <TextInput placeholder="Full Name" value={name} onChangeText={setName} style={{ marginBottom: 10, borderWidth: 1, padding: 10 }} />
      <TextInput placeholder="Contact" value={contact} onChangeText={setContact} keyboardType="phone-pad" style={{ marginBottom: 10, borderWidth: 1, padding: 10 }} />
      <TextInput placeholder="City" value={city} onChangeText={setCity} style={{ marginBottom: 10, borderWidth: 1, padding: 10 }} />
      <TextInput placeholder="Barangay" value={barangay} onChangeText={setBarangay} style={{ marginBottom: 10, borderWidth: 1, padding: 10 }} />
      <TextInput placeholder="Street" value={street} onChangeText={setStreet} style={{ marginBottom: 10, borderWidth: 1, padding: 10 }} />
      <TextInput placeholder="Zip Code" value={zipcode} onChangeText={setZipcode} keyboardType="numeric" style={{ marginBottom: 10, borderWidth: 1, padding: 10 }} />

      <Button title={loading ? 'Updating...' : 'Update Profile'} onPress={handleUpdate} disabled={loading} />
    </ScrollView>
  );
}
