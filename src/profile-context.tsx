import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { PropsWithChildren } from 'react';

import { getProfile } from './storage';
import type { UserProfile } from './types';

interface ProfileContextValue {
  isLoading: boolean;
  profile: UserProfile | null;
  updateProfile: (profile: UserProfile | null) => void;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: PropsWithChildren) {
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    async function loadProfile() {
      const savedProfile = await getProfile();
      setProfile(savedProfile);
      setIsLoading(false);
    }

    void loadProfile();
  }, []);

  const updateProfile = useCallback((nextProfile: UserProfile | null) => {
    setProfile(nextProfile);
  }, []);

  const value = useMemo(
    () => ({ isLoading, profile, updateProfile }),
    [isLoading, profile, updateProfile],
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile(): ProfileContextValue {
  const context = useContext(ProfileContext);

  if (!context) {
    throw new Error('useProfile must be used inside ProfileProvider');
  }

  return context;
}
