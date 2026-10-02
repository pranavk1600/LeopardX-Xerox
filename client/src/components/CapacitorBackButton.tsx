import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { App as CapApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

export const CapacitorBackButton: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const handleBackButton = CapApp.addListener('backButton', () => {
      const currentPath = location.pathname;

      if (
        currentPath === '/admin/login' ||
        currentPath === '/admin/forgot-password' ||
        currentPath === '/'
      ) {
        CapApp.exitApp();
      } else {
        navigate(-1);
      }
    });

    return () => {
      handleBackButton.then((h) => h.remove());
    };
  }, [location.pathname, navigate]);

  return null;
};
