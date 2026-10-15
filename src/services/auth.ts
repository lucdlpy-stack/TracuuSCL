import { AuthUser, PasswordValidationResult } from '../types/asset';

const AUTH_STORAGE_KEY = 'evn_auth_token_v1';
const USER_STORAGE_KEY = 'evn_auth_user_v1';

export function validatePassword(password: string): PasswordValidationResult {
  const hasMinLength = password.length >= 6;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  const valid = hasMinLength && hasLetter && hasNumber;
  let message = '';
  if (!hasMinLength) {
    message = 'Mật khẩu phải có ít nhất 6 ký tự.';
  } else if (!hasLetter || !hasNumber) {
    message = 'Mật khẩu phải bao gồm cả chữ và số (ví dụ: Evn2026).';
  }

  return {
    valid,
    hasMinLength,
    hasLetter,
    hasNumber,
    message: valid ? undefined : message,
  };
}

export function getStoredToken(): string | null {
  return localStorage.getItem(AUTH_STORAGE_KEY);
}

export function getStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredAuth(token: string, user: AuthUser): void {
  localStorage.setItem(AUTH_STORAGE_KEY, token);
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
}

export function clearStoredAuth(): void {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  localStorage.removeItem(USER_STORAGE_KEY);
}

export async function loginUser(account: string, password: string): Promise<{ user: AuthUser; token: string }> {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ account, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Đăng nhập không thành công.');
    }

    setStoredAuth(data.token, data.user);
    return data;
  } catch (err: any) {
    // If backend is not reached or network error, fallback to offline EVN verification
    if (account.trim() && password.trim()) {
      const passVal = validatePassword(password);
      if (!passVal.valid) {
        throw new Error(passVal.message || 'Mật khẩu phải bao gồm cả chữ và số.');
      }

      // Check pre-configured demo credentials
      const normalized = account.trim().toLowerCase();
      if (
        (normalized === 'admin' || normalized === 'admin@evn.com.vn') &&
        password === 'EvnAdmin2026'
      ) {
        const user: AuthUser = {
          id: 'USR-001',
          username: 'admin',
          name: 'Quản trị viên EVN',
          email: 'admin@evn.com.vn',
          role: 'Admin',
          unit: 'Công ty Điện lực Chợ Lớn',
        };
        const token = `EVN_TOKEN_${user.id}_${Date.now()}`;
        setStoredAuth(token, user);
        return { user, token };
      }

      if (
        (normalized === 'kythuat' || normalized === 'kythuat@evn.com.vn') &&
        password === 'Kythuat2026'
      ) {
        const user: AuthUser = {
          id: 'USR-002',
          username: 'kythuat',
          name: 'Kỹ sư Quản lý Kỹ thuật',
          email: 'kythuat@evn.com.vn',
          role: 'Technical',
          unit: 'Công ty Điện lực Chợ Lớn',
        };
        const token = `EVN_TOKEN_${user.id}_${Date.now()}`;
        setStoredAuth(token, user);
        return { user, token };
      }

      if (
        (normalized === 'vanhanh' || normalized === 'vanhanh@evn.com.vn') &&
        password === 'Vanhanh2026'
      ) {
        const user: AuthUser = {
          id: 'USR-003',
          username: 'vanhanh',
          name: 'Kỹ sư Quản lý Vận hành',
          email: 'vanhanh@evn.com.vn',
          role: 'Operator',
          unit: 'Công ty Điện lực Tân Thuận',
        };
        const token = `EVN_TOKEN_${user.id}_${Date.now()}`;
        setStoredAuth(token, user);
        return { user, token };
      }
    }
    throw err;
  }
}

export async function registerUser(payload: {
  username: string;
  name: string;
  email: string;
  password: string;
  unit?: string;
}): Promise<{ user: AuthUser; token: string }> {
  const passVal = validatePassword(payload.password);
  if (!passVal.valid) {
    throw new Error(passVal.message || 'Mật khẩu phải bao gồm cả chữ và số.');
  }

  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Đăng ký không thành công.');
  }

  setStoredAuth(data.token, data.user);
  return data;
}

export async function checkAuth(): Promise<AuthUser | null> {
  const token = getStoredToken();
  if (!token) return null;

  try {
    const res = await fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      clearStoredAuth();
      return null;
    }
    const data = await res.json();
    return data.user;
  } catch {
    // If network fails, rely on cached stored user
    return getStoredUser();
  }
}
