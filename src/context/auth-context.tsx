import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  UserProfile,
  DArtWork,
  Comment,
  ContentReport,
  Notification,
} from '@/types/app';

export * from '@/types/app';

let currentAuthToken: string | null = null;

export const setGlobalAuthToken = (token: string | null) => {
  currentAuthToken = token;
};

const getApiUrl = (path: string) => {
  if (Platform.OS === 'web' || typeof window !== 'undefined') {
    return path;
  }
  const debuggerHost = Constants.expoConfig?.hostUri;
  if (debuggerHost) {
    const ip = debuggerHost.split(':')[0];
    return `http://${ip}:8081${path}`;
  }
  return `http://localhost:8081${path}`;
};

const getApiHeaders = () => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (currentAuthToken) {
    headers['Authorization'] = `Bearer ${currentAuthToken}`;
  }
  return headers;
};

const apiPost = async (path: string, body: any) => {
  try {
    const res = await fetch(getApiUrl(path), {
      method: 'POST',
      headers: getApiHeaders(),
      body: JSON.stringify(body),
    });
    return await res.json();
  } catch (err) {
    console.error(`POST ${path} failed:`, err);
  }
};

const apiPatch = async (path: string, body: any) => {
  try {
    const res = await fetch(getApiUrl(path), {
      method: 'PATCH',
      headers: getApiHeaders(),
      body: JSON.stringify(body),
    });
    return await res.json();
  } catch (err) {
    console.error(`PATCH ${path} failed:`, err);
  }
};

const apiDelete = async (path: string, body: any) => {
  try {
    const res = await fetch(getApiUrl(path), {
      method: 'DELETE',
      headers: getApiHeaders(),
      body: JSON.stringify(body),
    });
    return await res.json();
  } catch (err) {
    console.error(`DELETE ${path} failed:`, err);
  }
};

interface AuthContextType {
  currentUser: UserProfile | null;
  authToken: string | null;
  dArtWorks: DArtWork[];
  users: UserProfile[];
  notifications: Notification[];
  reports: ContentReport[];
  language: 'it' | 'en';
  isRemembered: boolean;
  setLanguage: (lang: 'it' | 'en') => void;
  login: (username: string, email: string, password?: string) => boolean;
  loginWithGoogle: () => void;
  loginAsUser: (username: string) => void;
  logout: () => void;
  register: (username: string, email: string, bio: string, password: string) => Promise<boolean>;
  toggleRememberMe: () => void;
  updateBio: (newBio: string) => void;
  updateAvatar: (emoji: string, color?: string) => void;
  updateHashtags: (hashtags: string[]) => void;
  publishDArtWork: (
    title: string,
    description: string,
    locationName: string,
    hashtags: string[],
    preview?: string,
    license?: string,
    latitude?: number,
    longitude?: number,
    durationHours?: number,
    scale?: number,
    rotation?: number
  ) => void;
  likeDArtWork: (artworkId: string) => void;
  commentDArtWork: (artworkId: string, text: string) => void;
  visitDArtWork: (artworkId: string) => void;
  toggleFollowUser: (username: string) => void;
  toggleFavoriteCollection: (artworkId: string) => void;
  setCollection: (artworkIds: string[]) => void;
  reportContent: (
    targetId: string,
    targetType: 'artwork' | 'comment',
    category: 'offensive' | 'copyright' | 'spam' | 'danger',
    reason?: string
  ) => { success: boolean; message: string };
  dismissReports: (targetId: string) => void;
  removeReportedContent: (targetId: string, targetType: 'artwork' | 'comment') => void;
  toggleSensitiveContent: (artworkId: string) => void;
  updateSettings: (settings: Partial<UserProfile['settings']>) => void;
  deleteAccount: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [authToken, setAuthTokenState] = useState<string | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [dArtWorks, setDArtWorks] = useState<DArtWork[]>([]);
  const [reports, setReports] = useState<ContentReport[]>([]);
  const [language, setLanguageState] = useState<'it' | 'en'>('it');
  const [isRemembered, setIsRemembered] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const setAuthToken = (token: string | null) => {
    setAuthTokenState(token);
    setGlobalAuthToken(token);
    if (token) {
      AsyncStorage.setItem('dart_auth_token', token).catch(console.error);
    } else {
      AsyncStorage.removeItem('dart_auth_token').catch(console.error);
    }
  };

  const fetchTokenForUser = async (username: string, email?: string): Promise<string | null> => {
    try {
      const res = await fetch(getApiUrl('/api/authentications'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email }),
      });
      if (res.ok) {
        const data = await res.json();
        return data.token || null;
      }
    } catch (err) {
      console.error('Failed to get token from /api/authentications:', err);
    }
    return null;
  };

  const applyUserSession = async (user: UserProfile | null) => {
    setCurrentUser(user);
    if (user) {
      AsyncStorage.setItem('dart_session_username', user.username).catch(console.error);
      const token = await fetchTokenForUser(user.username, user.email);
      if (token) {
        setAuthToken(token);
      }
    } else {
      setAuthToken(null);
      AsyncStorage.removeItem('dart_session_username').catch(console.error);
    }
  };

  const setLanguage = (lang: 'it' | 'en') => {
    setLanguageState(lang);
    AsyncStorage.setItem('dart_language', lang).catch(console.error);
    if (currentUser) updateSettings({ language: lang });
  };

  // Load from individual REST APIs on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [artsRes, usersRes, reportsRes] = await Promise.all([
          fetch(getApiUrl('/api/dartworks')).catch(() => null),
          fetch(getApiUrl('/api/users')).catch(() => null),
          fetch(getApiUrl('/api/reports')).catch(() => null),
        ]);

        if (artsRes && artsRes.ok) {
          const artsData = await artsRes.json();
          if (Array.isArray(artsData) && artsData.length > 0) {
            setDArtWorks(artsData);
          }
        }

        if (usersRes && usersRes.ok) {
          const usersData = await usersRes.json();
          if (Array.isArray(usersData) && usersData.length > 0) {
            setUsers(usersData);
            const savedUser = await AsyncStorage.getItem('dart_session_username');
            const savedToken = await AsyncStorage.getItem('dart_auth_token');
            if (savedToken) {
              setAuthToken(savedToken);
            }
            if (savedUser) {
              const u = usersData.find(
                (user: UserProfile) => user.username.toLowerCase() === savedUser.toLowerCase()
              );
              if (u) {
                setCurrentUser(u);
                if (!savedToken) {
                  fetchTokenForUser(u.username, u.email).then((tok) => {
                    if (tok) setAuthToken(tok);
                  });
                }
              }
            }
          }
        }

        if (reportsRes && reportsRes.ok) {
          const reportsData = await reportsRes.json();
          if (Array.isArray(reportsData)) {
            setReports(reportsData);
          }
        }
      } catch (err) {
        console.error('Failed to fetch data from API:', err);
      }
    };
    loadData();
  }, []);

  const login = (username: string, email: string, password?: string): boolean => {
    const found = users.find(
      (u) =>
        (u.username.toLowerCase() === username.toLowerCase() ||
          u.email.toLowerCase() === email.toLowerCase()) &&
        (!password || u.password === password)
    );
    if (found) {
      applyUserSession(found);
      return true;
    }
    return false;
  };

  const loginWithGoogle = () => {
    const user = users.find((u) => u.username === 'davide_db') || users[0];
    if (user) {
      applyUserSession(user);
    }
  };

  const loginAsUser = (targetUsername: string) => {
    const user = users.find((u) => u.username.toLowerCase() === targetUsername.toLowerCase());
    if (user) {
      applyUserSession(user);
    }
  };

  const logout = () => {
    applyUserSession(null);
  };

  const register = async (username: string, email: string, bio: string, password: string): Promise<boolean> => {
    const exists = users.some(
      (u) => u.username.toLowerCase() === username.toLowerCase() || u.email.toLowerCase() === email.toLowerCase()
    );
    if (exists) return false;

    const newUser: UserProfile = {
      username,
      email,
      bio: bio || "Nuovo esploratore D'Art",
      profilePicColor: '#D8B4F8',
      profilePicEmoji: '🦊',
      album: [],
      collection: [],
      exposition: [],
      followers: [],
      following: [],
      badges: ['Pioniere Digitale'],
      password,
      settings: {
        notifyFollowedArtist: true,
        notifyTrendingNearby: true,
        notifyLikes: true,
        notifyComments: true,
      },
    };

    setUsers((prev) => [...prev, newUser]);
    applyUserSession(newUser);
    apiPost('/api/users', { username, email, newUser, password });
    return true;
  };

  const toggleRememberMe = () => setIsRemembered((p) => !p);

  const updateBio = (newBio: string) => {
    if (!currentUser) return;
    const bio = newBio.slice(0, 350);
    const updated = { ...currentUser, bio };
    setCurrentUser(updated);
    setUsers((prev) => prev.map((u) => (u.username === currentUser.username ? updated : u)));
    apiPatch(`/api/users/${currentUser.username}/bio`, { bio });
  };

  const updateAvatar = (emoji: string, color?: string) => {
    if (!currentUser) return;
    const updated = {
      ...currentUser,
      profilePicEmoji: emoji,
      profilePicColor: color || currentUser.profilePicColor,
    };
    setCurrentUser(updated);
    setUsers((prev) => prev.map((u) => (u.username === currentUser.username ? updated : u)));
    apiPatch(`/api/users/${currentUser.username}/avatar`, {
      emoji,
      color: color || currentUser.profilePicColor,
    });
  };

  const updateHashtags = (hashtags: string[]) => {
    if (!currentUser) return;
    const cleanTags = hashtags.map((h) => h.replace('#', '').trim()).filter((h) => h.length > 0);
    const updated = {
      ...currentUser,
      hashtags: cleanTags,
    };
    setCurrentUser(updated);
    setUsers((prev) => prev.map((u) => (u.username === currentUser.username ? updated : u)));
    apiPatch(`/api/users/${currentUser.username}/hashtags`, {
      hashtags: cleanTags,
    });
  };

  const publishDArtWork = (
    title: string,
    description: string,
    locationName: string,
    hashtags: string[],
    preview?: string,
    license?: string,
    latitude?: number,
    longitude?: number,
    durationHours?: number,
    scale?: number,
    rotation?: number
  ) => {
    if (!currentUser) return;
    const newArtId = `art-${Date.now()}`;
    const newArt: DArtWork = {
      id: newArtId,
      title,
      artist: currentUser.username,
      description,
      locationName: locationName || 'Trento Centro',
      latitude: typeof latitude === 'number' ? latitude : 46.0692 + (Math.random() - 0.5) * 0.004,
      longitude: typeof longitude === 'number' ? longitude : 11.1205 + (Math.random() - 0.5) * 0.004,
      hashtags: hashtags.length > 0 ? hashtags : ['DArt', 'StreetArt'],
      likesCount: 0,
      likedByUsernames: [],
      comments: [],
      preview: preview || undefined,
      scale: typeof scale === 'number' ? scale : 1.0,
      rotation: typeof rotation === 'number' ? rotation : 0,
      createdAt: 'Appena adesso',
      durationHours: durationHours || 48,
      license: license || 'Creative Commons BY 4.0',
      viewsCount: 1,
      reportsCount: 0,
      isSensitive: false,
    };

    setDArtWorks((prev) => [newArt, ...prev]);
    const updated = { ...currentUser, exposition: [...currentUser.exposition, newArtId] };
    setCurrentUser(updated);
    setUsers((prev) => prev.map((u) => (u.username === currentUser.username ? updated : u)));
    apiPost('/api/dartworks', { dArtWork: newArt, username: currentUser.username });
  };

  const likeDArtWork = (artworkId: string) => {
    if (!currentUser) return;
    const user = currentUser.username;
    setDArtWorks((prev) =>
      prev.map((art) => {
        if (art.id !== artworkId) return art;
        const isLiked = art.likedByUsernames.includes(user);
        const likedByUsernames = isLiked
          ? art.likedByUsernames.filter((n) => n !== user)
          : [...art.likedByUsernames, user];
        return { ...art, likedByUsernames, likesCount: likedByUsernames.length };
      })
    );
    apiPost(`/api/dartworks/${artworkId}/like`, { artworkId, username: user });
  };

  const commentDArtWork = (artworkId: string, text: string) => {
    if (!currentUser) return;
    const newComment: Comment = {
      id: `c-${Date.now()}`,
      artworkId,
      username: currentUser.username,
      text,
      createdAt: 'Appena adesso',
    };
    setDArtWorks((prev) =>
      prev.map((art) =>
        art.id === artworkId ? { ...art, comments: [...art.comments, newComment] } : art
      )
    );
    apiPost(`/api/dartworks/${artworkId}/comments`, { comment: newComment });
  };

  const visitDArtWork = (artworkId: string) => {
    if (!currentUser) return;
    if (!currentUser.album.includes(artworkId)) {
      const updated = { ...currentUser, album: [...currentUser.album, artworkId] };
      setCurrentUser(updated);
      setUsers((prev) => prev.map((u) => (u.username === currentUser.username ? updated : u)));
      apiPost(`/api/dartworks/${artworkId}/visit`, { artworkId });
    }
  };

  const toggleFollowUser = (targetUsername: string) => {
    if (!currentUser || currentUser.username === targetUsername) return;
    const isFollowing = currentUser.following.includes(targetUsername);
    const following = isFollowing
      ? currentUser.following.filter((n) => n !== targetUsername)
      : [...currentUser.following, targetUsername];
    const updated = { ...currentUser, following };
    setCurrentUser(updated);
    setUsers((prev) =>
      prev.map((u) => {
        if (u.username === currentUser.username) return updated;
        if (u.username === targetUsername) {
          const followers = isFollowing
            ? u.followers.filter((n) => n !== currentUser.username)
            : [...u.followers, currentUser.username];
          return { ...u, followers };
        }
        return u;
      })
    );
    apiPost(`/api/users/${targetUsername}/follow`, { myUsername: currentUser.username });
  };

  const toggleFavoriteCollection = (artworkId: string) => {
    if (!currentUser) return;
    const isColl = currentUser.collection.includes(artworkId);
    let collection = [...currentUser.collection];
    if (isColl) {
      collection = collection.filter((id) => id !== artworkId);
    } else {
      if (collection.length >= 3) collection.shift();
      collection.push(artworkId);
    }
    const updated = { ...currentUser, collection };
    setCurrentUser(updated);
    setUsers((prev) => prev.map((u) => (u.username === currentUser.username ? updated : u)));
    apiPost(`/api/users/${currentUser.username}/collection`, { artworkId });
  };

  const setCollection = (artworkIds: string[]) => {
    if (!currentUser) return;
    const limited = artworkIds.slice(0, 3);
    const updated = { ...currentUser, collection: limited };
    setCurrentUser(updated);
    setUsers((prev) => prev.map((u) => (u.username === currentUser.username ? updated : u)));
    apiPost(`/api/users/${currentUser.username}/collection`, { collection: limited });
  };

  const reportContent = (
    targetId: string,
    targetType: 'artwork' | 'comment',
    category: 'offensive' | 'copyright' | 'spam' | 'danger',
    reason?: string
  ): { success: boolean; message: string } => {
    if (!currentUser) return { success: false, message: 'Effettua il login per segnalare.' };
    const newReport: ContentReport = {
      id: `rep-${Date.now()}`,
      targetId,
      targetType,
      reporterUsername: currentUser.username,
      category,
      reason,
      createdAt: new Date().toISOString(),
    };
    setReports((prev) => [newReport, ...prev]);
    apiPost('/api/reports', {
      targetId,
      targetType,
      category,
      reason,
      reporterUsername: currentUser.username,
    });
    return { success: true, message: 'Segnalazione inviata con successo!' };
  };

  const dismissReports = (targetId: string) => {
    setReports((prev) => prev.filter((r) => r.targetId !== targetId));
    apiDelete(`/api/reports/${targetId}`);
  };

  const removeReportedContent = (targetId: string, targetType: 'artwork' | 'comment') => {
    setReports((prev) => prev.filter((r) => r.targetId !== targetId));
    if (targetType === 'artwork') {
      setDArtWorks((prev) => prev.filter((a) => a.id !== targetId));
      apiDelete(`/api/dartworks/${targetId}`);
    } else {
      setDArtWorks((prev) =>
        prev.map((a) => ({
          ...a,
          comments: a.comments.filter((c) => c.id !== targetId),
        }))
      );
      apiDelete(`/api/comments/${targetId}`);
    }
    apiDelete(`/api/reports/${targetId}`);
  };

  const toggleSensitiveContent = (artworkId: string) => {
    setDArtWorks((prev) =>
      prev.map((a) => (a.id === artworkId ? { ...a, isSensitive: !a.isSensitive } : a))
    );
  };

  const updateSettings = (settings: Partial<UserProfile['settings']>) => {
    if (!currentUser) return;
    const updated = { ...currentUser, settings: { ...currentUser.settings, ...settings } };
    setCurrentUser(updated);
    setUsers((prev) => prev.map((u) => (u.username === currentUser.username ? updated : u)));
  };

  const deleteAccount = () => {
    if (!currentUser) return;
    const uname = currentUser.username;
    setUsers((prev) => prev.filter((u) => u.username !== uname));
    setCurrentUser(null);
    apiDelete('/api/users', { username: uname });
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        authToken,
        dArtWorks,
        users,
        notifications,
        reports,
        language,
        isRemembered,
        setLanguage,
        login,
        loginWithGoogle,
        loginAsUser,
        logout,
        register,
        toggleRememberMe,
        updateBio,
        updateAvatar,
        updateHashtags,
        publishDArtWork,
        likeDArtWork,
        commentDArtWork,
        visitDArtWork,
        toggleFollowUser,
        toggleFavoriteCollection,
        setCollection,
        reportContent,
        dismissReports,
        removeReportedContent,
        toggleSensitiveContent,
        updateSettings,
        deleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
