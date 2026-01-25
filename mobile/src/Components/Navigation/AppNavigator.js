import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import UserStack from './UserStack';
import AdminStack from './AdminStack';
import { getUser } from '../utils/helper';

export default function AppNavigator() {
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      const user = await getUser();
      if (user) setUserRole(user.role);
    };
    fetchUser();
  }, []);

  return (
    <NavigationContainer>
      {userRole === 'admin' ? <AdminStack /> : <UserStack />}
    </NavigationContainer>
  );
}
