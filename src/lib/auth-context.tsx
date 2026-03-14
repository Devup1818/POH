'use client';

import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from 'react';
import type { UserRole } from '@/types';

export interface AppUser {
  id: string;
  name: string;
  role: UserRole;
  shed: string;
  initials: string;
  phone: string;
  password: string;
}

interface AuthContextValue {
  user: AppUser | null;
  users: AppUser[];
  loginByName: (name: string, password: string) => { success: boolean; error?: string; userId?: string; phone?: string };
  logout: () => void;
  createUser: (name: string, role: UserRole, shed: string, phone: string, password: string) => AppUser;
  verifyOtp: (userId: string, otp: string) => Promise<boolean>;
  generateOtp: (userId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/** Hash a string using SHA-256 (Web Crypto API) with fallback for non-secure contexts */
export async function sha256(message: string): Promise<string> {
  // crypto.subtle is only available in secure contexts (HTTPS / localhost in some browsers)
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  // Fallback: simple hash for dev/non-secure contexts (NOT for production use)
  let hash = 0;
  for (let i = 0; i < message.length; i++) {
    const char = message.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

/** Simulate sending SMS to a phone number. In production, replace with real SMS gateway (Twilio / MSG91 / AWS SNS). */
function sendSmsToPhone(phone: string, otp: string): void {
  // In production this would call an API endpoint that sends the OTP via SMS gateway.
  // The OTP is passed here only for the SMS dispatch — it is NOT stored in plain text on the client.
  console.log(
    `%c[SMS Gateway] OTP ${otp} sent to +91-${phone}`,
    'background: #1e40af; color: #fff; padding: 4px 8px; border-radius: 4px; font-weight: bold;',
  );
}

const SEED_USERS: AppUser[] = [
  { id: 'user-1', name: 'Rajesh Kumar', role: 'Admin', shed: 'EMU Car Shed Ghaziabad', initials: 'RK', phone: '9876543210', password: 'admin123' },
  { id: 'user-2', name: 'Suresh Patel', role: 'Senior_Section_Engineer', shed: 'EMU Car Shed Ghaziabad', initials: 'SP', phone: '9876543211', password: 'engineer123' },
  { id: 'user-3', name: 'Priya Verma', role: 'Technician', shed: 'EMU Car Shed Virar', initials: 'PV', phone: '9876543212', password: 'tech123' },
  { id: 'user-4', name: 'Amit Singh', role: 'Viewer', shed: 'MEMU Shed Lucknow', initials: 'AS', phone: '9876543213', password: 'viewer123' },
];

const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

let _nextUserId = 10;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<AppUser[]>(SEED_USERS);
  const [user, setUser] = useState<AppUser | null>(null);
  // Store hashed OTPs with expiry: userId -> { hash, expiresAt }
  const otpStoreRef = useRef<Record<string, { hash: string; expiresAt: number }>>({});

  const loginByName = useCallback(
    (name: string, password: string) => {
      const trimmed = name.trim().toLowerCase();
      const found = users.find((u) => u.name.toLowerCase() === trimmed);
      if (!found) return { success: false, error: 'User not found. Check the name and try again.' };
      if (found.password !== password) return { success: false, error: 'Incorrect password' };
      return { success: true, userId: found.id, phone: found.phone };
    },
    [users],
  );

  const generateOtp = useCallback(
    async (userId: string) => {
      const found = users.find((u) => u.id === userId);
      if (!found) return;

      // Generate a cryptographically random 6-digit OTP
      const randomBytes = new Uint32Array(1);
      crypto.getRandomValues(randomBytes);
      const otp = String(100000 + (randomBytes[0] % 900000));

      // Hash the OTP before storing — plain text OTP is never kept in memory
      const hashed = await sha256(otp);
      otpStoreRef.current[userId] = {
        hash: hashed,
        expiresAt: Date.now() + OTP_EXPIRY_MS,
      };

      // Send OTP to user's registered mobile via SMS gateway
      sendSmsToPhone(found.phone, otp);
    },
    [users],
  );

  const verifyOtp = useCallback(
    async (userId: string, otp: string) => {
      const stored = otpStoreRef.current[userId];
      if (!stored) return false;

      // Check expiry
      if (Date.now() > stored.expiresAt) {
        delete otpStoreRef.current[userId];
        return false;
      }

      // Hash the entered OTP and compare with stored hash
      const enteredHash = await sha256(otp);
      if (enteredHash !== stored.hash) return false;

      // OTP verified — log the user in
      const found = users.find((u) => u.id === userId);
      if (found) {
        setUser(found);
        delete otpStoreRef.current[userId];
        return true;
      }
      return false;
    },
    [users],
  );

  const logout = useCallback(() => setUser(null), []);

  const createUser = useCallback((name: string, role: UserRole, shed: string, phone: string, password: string) => {
    const newUser: AppUser = {
      id: `user-${++_nextUserId}`,
      name: name.trim(),
      role,
      shed,
      initials: getInitials(name.trim()),
      phone: phone.trim(),
      password,
    };
    setUsers((prev) => [...prev, newUser]);
    return newUser;
  }, []);

  return (
    <AuthContext.Provider value={{ user, users, loginByName, logout, createUser, verifyOtp, generateOtp }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
