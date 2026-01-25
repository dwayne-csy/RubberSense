import React, { useState } from 'react';
import { View, TextInput, Button, Alert, TouchableOpacity, Text, StyleSheet } from 'react-native';
import axios from 'axios';
import { authenticate } from '../../utils/helper';
import { BACKEND_URL } from '@env';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${BACKEND_URL}/login`, { email, password });
      
      // Save token and user info
      await authenticate(res.data, () => {
        Alert.alert('Success', 'Login successful');
        
        // Check user role
        if (res.data.user.role === 'admin') {
          // For admin, AppNavigator will switch to AdminStack
          // The AdminStack has initialRouteName="AdminDashboard"
          // So it will automatically show AdminDashboard
        } else {
          // For regular user, navigate to UserHome within UserStack
          // We're already in UserStack, so we can navigate directly
          navigation.reset({
            index: 0,
            routes: [{ name: 'UserHome' }],
          });
        }
      });

    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        style={styles.input}
      />
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />

      <Button title={loading ? 'Logging in...' : 'Login'} onPress={handleLogin} disabled={loading} />

      <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.signUpLink}>
        <Text style={{ color: 'blue' }}>Don't have an account? Sign Up</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  input: {
    marginBottom: 10,
    borderWidth: 1,
    padding: 10,
    borderRadius: 5,
  },
  signUpLink: {
    marginTop: 20,
    alignItems: 'center',
  },
});