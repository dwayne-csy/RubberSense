import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import UserStack from './UserStack';
import AdminStack from './AdminStack';
import { getUser, onAuthChange } from '../utils/helper';

export default function AppNavigator() {
  const [userRole, setUserRole] = useState(null);
  const [initialized, setInitialized] = useState(false);
  const [prevRole, setPrevRole] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      const user = await getUser();
      setUserRole(user?.role || null);
      setPrevRole(user?.role || null);
      setInitialized(true);
    };
    fetchUser();

    // Listen for auth changes
    const unsubscribe = onAuthChange((user) => {
      const newRole = user?.role || null;
      
      // Only update if role actually changed
      if (newRole !== prevRole) {
        setUserRole(newRole);
        setPrevRole(newRole);
      }
    });

    return () => unsubscribe();
  }, [prevRole]);

  // Don't render until we know the initial auth state
  if (!initialized) {
    return null;
  }

  return (
    <NavigationContainer>
      {userRole === 'admin' ? <AdminStack /> : <UserStack />}
    </NavigationContainer>
  );
}