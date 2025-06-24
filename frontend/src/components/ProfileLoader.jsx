import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";

// This component can be used as a wrapper to ensure profile is loaded
export const ProfileLoader = ({ children }) => {
  const { user, profile, loading, profileLoading, fetchProfile } = useAuth();
  const [fetchAttempted, setFetchAttempted] = useState(false);

  useEffect(() => {
    // If we have a user but no profile, try to fetch the profile using email
    if (user && !profile && !loading && !profileLoading && user.email && !fetchAttempted) {
      console.log("ProfileLoader: Fetching user profile for email:", user.email);
      setFetchAttempted(true);
      fetchProfile(user.email).finally(() => {
        console.log("ProfileLoader: Profile fetch completed");
      });
    }
  }, [user, profile, loading, profileLoading, fetchProfile, fetchAttempted]);

  // Reset fetch attempted when user changes
  useEffect(() => {
    if (!user) {
      setFetchAttempted(false);
    }
  }, [user]);

  return <>{children}</>;
};

export default ProfileLoader;