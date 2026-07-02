import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import employerProfileService from '../services/employerProfileService';

export const useCompanyProfileCompletion = () => {
  const { user } = useAuth();
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);

  // Calculate profile completion percentage
  const calculateProfileCompletion = (data) => {
    if (!data) return 0;
    
    let completion = 0;
    
    // Basic info (35% total - 7% each)
    if (data.companyName?.trim()) completion += 7;
    if (data.email?.trim()) completion += 7;
    if (data.phone?.trim()) completion += 7;
    if (data.address?.trim()) completion += 7;
    if (data.latitude?.trim() && data.longitude?.trim()) completion += 7; // GPS location
    
    // Business info (30% total - 10% each)
    if (data.industry?.trim()) completion += 10;
    if (data.companySize?.trim()) completion += 10;
    if (data.description?.trim()) completion += 10;
    
    // Company logo (15%)
    if (data.companyLogo) completion += 15;
    
    // Website (5%)
    if (data.website?.trim()) completion += 5;
    
    // Legal documents (20% - 10% each)
    if (data.taxCode?.trim()) completion += 10;
    if (data.businessLicense?.trim()) completion += 10;
    
    return Math.min(completion, 100);
  };

  // Check if profile is considered "complete" (minimum 70%)
  const checkProfileComplete = (completion) => {
    return completion >= 70;
  };

  // Load profile data and calculate completion
  useEffect(() => {
    const loadProfileCompletion = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const profile = await employerProfileService.getMyProfile().catch(() => null);

        if (profile) {
          const completion = calculateProfileCompletion(profile);
          setProfileCompletion(completion);
          setIsProfileComplete(checkProfileComplete(completion));
          setProfileData(profile);
        } else {
          setProfileCompletion(0);
          setIsProfileComplete(false);
          setProfileData(null);
        }
      } catch (error) {
        console.error('Error loading profile completion:', error);
        setProfileCompletion(0);
        setIsProfileComplete(false);
        setProfileData(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfileCompletion();
  }, [user]);

  // Refresh profile completion (call this after profile updates)
  const refreshProfileCompletion = async () => {
    if (!user) return;

    try {
      const profile = await employerProfileService.getMyProfile().catch(() => null);
      if (profile) {
        const completion = calculateProfileCompletion(profile);
        setProfileCompletion(completion);
        setIsProfileComplete(checkProfileComplete(completion));
        setProfileData(profile);
      }
    } catch (error) {
      console.error('Error refreshing profile completion:', error);
    }
  };

  return {
    profileCompletion,
    isProfileComplete,
    isLoading,
    profileData,
    refreshProfileCompletion
  };
};
