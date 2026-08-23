import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { pushNotificationService } from '../services/pushNotificationService';

export const AuthContext = createContext<any>(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [realUser, setRealUser] = useState<any>(null);
  const [realRole, setRealRole] = useState<any>(null); // 'hod', 'coordinator', 'faculty', or 'student'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const impersonateToken = urlParams.get('impersonate_token');
      
      const storedToken = impersonateToken || localStorage.getItem('acronexus_token');
      
      if (storedToken) {
        try {
          const profileRes = await authService.getProfile();
          if (profileRes.success) {
            setRealUser(profileRes.data);
            setRealRole(profileRes.data.role.replace('ROLE_', '').toLowerCase());
            
            // Automatically register FCM token if permission is granted
            pushNotificationService.requestPermissionAndRegister().catch(console.error);
          }
        } catch (error) {
          console.error("Failed to fetch profile", error);
          if (!impersonateToken) {
            localStorage.removeItem('acronexus_token');
          }
        }
      }
      setLoading(false);
    };

    initializeAuth();

    const handleSync = () => {
      if (localStorage.getItem('acronexus_token')) {
        authService.getProfile().then(profileRes => {
          if (profileRes.success) {
            setRealUser(profileRes.data);
          }
        });
      }
    };

    window.addEventListener('sync-attendance-data', handleSync);
    window.addEventListener('sync-auth-profile', handleSync);
    return () => {
      window.removeEventListener('sync-attendance-data', handleSync);
      window.removeEventListener('sync-auth-profile', handleSync);
    };
  }, []);

  const login = async (credentials: any) => {
    try {
      const response = await authService.login(credentials);
      if (response.success && response.data) {
        localStorage.setItem('acronexus_token', response.data.token);
        
        // Fetch full profile
        const profileRes = await authService.getProfile();
        if (profileRes.success) {
          const fetchedRole = profileRes.data.role.replace('ROLE_', '').toLowerCase();
          setRealUser(profileRes.data);
          setRealRole(fetchedRole);
          
          // Automatically prompt/register FCM token upon login
          pushNotificationService.requestPermissionAndRegister().catch(console.error);
          
          return { success: true, role: fetchedRole };
        }
      }
      return { success: false, message: response.message || 'Login failed' };
    } catch (error: any) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Login failed. Please check your credentials.' 
      };
    }
  };

  const logout = async () => {
    setRealUser(null);
    setRealRole(null);
    try {
      await pushNotificationService.unregisterToken();
    } catch (e) {
      console.error('Failed to unregister push token during logout', e);
    }
    localStorage.removeItem('acronexus_token');
    localStorage.removeItem('acronexus_user');
    localStorage.removeItem('acronexus_role');
    sessionStorage.clear();
  };

  const user = realUser;
  const role = realRole;

  return (
    <AuthContext.Provider value={{ 
      user, role, realUser, realRole, 
      login, logout, loading
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
