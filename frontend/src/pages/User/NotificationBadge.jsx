import React, { useState, useEffect } from 'react';
import volunteerRequestApi from '../../api/endpoints/VolunteerRequestAPI';
import { fetchMyVolunteerProfile } from '../../api/endpoints/VolunteerAPI';

const NotificationBadge = ({ className = "" }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasProfile, setHasProfile] = useState(false);

  // Check if user has volunteer profile
  useEffect(() => {
    const checkProfile = async () => {
      try {
        const response = await fetchMyVolunteerProfile();
        if (response) {
          setHasProfile(true);
          
          // Fetch unread count
         try {
            const invitationsResponse = await volunteerRequestApi.fetchMyInvitations('pending');
            setUnreadCount(invitationsResponse.invitations?.length || 0);
          } catch (err) {
            console.error('Failed to fetch pending invitations count:', err);
          }
        }
      } catch (err) {
        setHasProfile(false);
      }
    };

    checkProfile();
  }, []);

  // WebSocket for real-time updates
  useEffect(() => {
    if (!hasProfile) return;

    let socket = null;
    try {
      socket = volunteerRequestApi.createNotificationWebSocket(
        (data) => {
          if (data.type === 'unread_count') {
            setUnreadCount(data.count);
          }
        },
        (error) => console.error('WebSocket error:', error),
        () => console.log('WebSocket disconnected')
      );
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
    }

    return () => {
      if (socket) socket.close();
    };
  }, [hasProfile]);

  if (!hasProfile || unreadCount === 0) return null;

  return (
    <span className={`
      absolute 
      -top-1 -right-1
      bg-red-500 text-white 
      text-xs font-medium 
      rounded-full 
      min-w-[1.25rem] h-5 
      flex items-center justify-center 
      px-1
      border-2 border-white
      shadow-sm
      z-10
      ${className}
    `}>
      {unreadCount > 99 ? '99+' : unreadCount > 9 ? '9+' : unreadCount}
    </span>
  );
};

export default NotificationBadge;