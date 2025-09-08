import { Navigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import orgDashboardApi from "../api/endpoints/OrgAPI";
import Loading from "./common/Loading";


export default function VerifiedProtectedRoute({ children }) {
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(null);

  useEffect(() => {
    const fetchOrgProfile = async () => {
      try {
        const profileData = await orgDashboardApi.fetchOrgProfile();
        setIsVerified(profileData?.is_verified);
      } catch (error) {
        console.error("Error fetching organization profile:", error);
        setIsVerified(false);
      } finally {
        setLoading(false);
      }
    };

    fetchOrgProfile();
  }, []);

  if (loading) {
    return <Loading />; // can replace with spinner
  }

  if (!isVerified) {
    return (
      <Navigate
        to="/organization/profile"
        state={{ message: "You must be verified to access this page." }}
        replace
      />
    );
  }

  return children;
}
