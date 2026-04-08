// src/services/auth-client.ts
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const AUTH_URL = process.env.EXPO_PUBLIC_AUTH_URL || 'http://localhost:8787';
const TOKEN_KEY = 'ecoeats_session';
const REFRESH_TOKEN_KEY = 'ecoeats_refresh';

export interface Session {
  id: string;
  userId: string;
  expiresAt: Date;
  user: User;
}

export interface User {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  emailVerified: boolean;
}

class AuthClient {
  private session: Session | null = null;
  private listeners: Set<(session: Session | null) => void> = new Set();

  async getSession(): Promise<Session | null> {
    if (this.session) return this.session;

    const stored = await SecureStore.getItemAsync(TOKEN_KEY);
    if (!stored) return null;

    try {
      const parsed = JSON.parse(stored);
      this.session = {
        ...parsed,
        expiresAt: new Date(parsed.expiresAt),
      };
      return this.session;
    } catch {
      return null;
    }
  }

  async requestMagicLink(email: string): Promise<void> {
    const response = await fetch(`${AUTH_URL}/api/auth/magic-link`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to send magic link');
    }
  }

  async verifyMagicLink(token: string): Promise<Session> {
    const response = await fetch(`${AUTH_URL}/api/auth/magic-link/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to verify magic link');
    }

    const data = await response.json();
    this.session = {
      ...data.session,
      expiresAt: new Date(data.session.expiresAt),
    };

    // Store securely
    await SecureStore.setItemAsync(TOKEN_KEY, JSON.stringify(this.session));
    
    if (data.refreshToken) {
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, data.refreshToken);
    }

    this.notifyListeners();
    return this.session;
  }

  async signOut(): Promise<void> {
    try {
      const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
      if (refreshToken) {
        await fetch(`${AUTH_URL}/api/auth/signout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });
      }
    } catch {
      // Ignore signout errors
    }

    this.session = null;
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    this.notifyListeners();
  }

  onSessionChange(callback: (session: Session | null) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners(): void {
    for (const callback of this.listeners) {
      callback(this.session);
    }
  }

  getAccessToken(): string | null {
    return this.session?.id || null;
  }
}

export const authClient = new AuthClient();
