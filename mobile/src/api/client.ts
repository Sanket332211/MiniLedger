import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_TOKEN_KEY = '@miniledger_jwt_token';
const STORAGE_API_HOST_KEY = '@miniledger_api_host';

/**
 * Determine default host based on execution platform
 */
export function getDefaultApiHost(): string {
  if (Platform.OS === 'android') {
    // Android emulator special alias for host loopback
    return 'http://10.0.2.2:4000';
  }
  // Web, iOS simulator, or desktop
  return 'http://localhost:4000';
}

let activeBaseUrl = getDefaultApiHost();

export async function initApiHost(): Promise<string> {
  try {
    const saved = await AsyncStorage.getItem(STORAGE_API_HOST_KEY);
    if (saved) {
      activeBaseUrl = saved;
    }
  } catch {
    // fallback
  }
  return activeBaseUrl;
}

export async function setApiHost(url: string): Promise<void> {
  activeBaseUrl = url.trim().replace(/\/+$/, '');
  await AsyncStorage.setItem(STORAGE_API_HOST_KEY, activeBaseUrl);
}

export function getApiBaseUrl(): string {
  return activeBaseUrl;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  mockOtp?: string;
  token?: string;
  user?: any;
  count?: number;
}

export interface LoanItem {
  id: number;
  user_id: number;
  friend_name: string;
  amount: number;
  due_date: string;
  is_repaid: boolean;
  repaid_at: string | null;
  receipt_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  is_overdue?: boolean;
}

export interface LoanSummary {
  totalLent: number;
  totalRepaid: number;
  overdueAmount: number;
  pendingAmount: number;
  totalCount: number;
  repaidCount: number;
  pendingCount: number;
  overdueCount: number;
}

/**
 * Core HTTP Request Wrapper
 */
async function request<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = await AsyncStorage.getItem(STORAGE_TOKEN_KEY);

  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${activeBaseUrl}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMessage = data.error || data.message || `Request failed with status ${response.status}`;
      throw new Error(errorMessage);
    }

    return data;
  } catch (err: any) {
    console.error(`[API Error] ${endpoint}:`, err.message);
    throw err;
  }
}

// -------------------------------------------------------------
// Auth Endpoints
// -------------------------------------------------------------

export async function sendOtp(phone: string): Promise<ApiResponse> {
  return request('/api/auth/send-otp', {
    method: 'POST',
    body: JSON.stringify({ phone }),
  });
}

export async function verifyOtp(
  phone: string,
  otp: string
): Promise<{ token: string; user: any }> {
  const res = await request('/api/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ phone, otp }),
  });

  if (res.token) {
    await AsyncStorage.setItem(STORAGE_TOKEN_KEY, res.token);
  }

  return { token: res.token!, user: res.user };
}

export async function getMe(): Promise<any> {
  const res = await request('/api/auth/me', { method: 'GET' });
  return res.user;
}

export async function clearAuthToken(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_TOKEN_KEY);
}

// -------------------------------------------------------------
// Loans Endpoints
// -------------------------------------------------------------

export async function fetchLoans(
  filter?: 'all' | 'pending' | 'repaid' | 'overdue',
  search?: string
): Promise<LoanItem[]> {
  const params = new URLSearchParams();
  if (filter && filter !== 'all') params.append('filter', filter);
  if (search) params.append('search', search);

  const queryStr = params.toString() ? `?${params.toString()}` : '';
  const res = await request<LoanItem[]>(`/api/loans${queryStr}`, { method: 'GET' });
  return res.data || [];
}

export async function fetchSummary(): Promise<LoanSummary> {
  const res = await request<LoanSummary>('/api/loans/summary', { method: 'GET' });
  return (
    res.data || {
      totalLent: 0,
      totalRepaid: 0,
      overdueAmount: 0,
      pendingAmount: 0,
      totalCount: 0,
      repaidCount: 0,
      pendingCount: 0,
      overdueCount: 0,
    }
  );
}

export async function createLoan(payload: {
  friendName: string;
  amount: number;
  dueDate: string;
  notes?: string;
  receiptUrl?: string;
}): Promise<LoanItem> {
  const res = await request<LoanItem>('/api/loans', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.data!;
}

export async function markLoanRepaid(loanId: number): Promise<LoanItem> {
  const res = await request<LoanItem>(`/api/loans/${loanId}/repay`, {
    method: 'PATCH',
  });
  return res.data!;
}

export async function toggleLoanStatus(loanId: number, isRepaid: boolean): Promise<LoanItem> {
  const res = await request<LoanItem>(`/api/loans/${loanId}/status`, {
    method: 'PUT',
    body: JSON.stringify({ isRepaid }),
  });
  return res.data!;
}

export async function deleteLoan(loanId: number): Promise<void> {
  await request(`/api/loans/${loanId}`, { method: 'DELETE' });
}

// -------------------------------------------------------------
// Bonus: Receipt Image Upload
// -------------------------------------------------------------

export async function uploadReceiptPhoto(imageUri: string): Promise<string> {
  const token = await AsyncStorage.getItem(STORAGE_TOKEN_KEY);
  const formData = new FormData();

  const filename = imageUri.split('/').pop() || `receipt-${Date.now()}.jpg`;
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : `image/jpeg`;

  // Append image to FormData
  if (Platform.OS === 'web') {
    // For web, fetch blob from object URL or data URL
    const res = await fetch(imageUri);
    const blob = await res.blob();
    formData.append('receipt', blob, filename);
  } else {
    // React Native mobile
    formData.append('receipt', {
      uri: imageUri,
      name: filename,
      type,
    } as any);
  }

  const uploadUrl = `${activeBaseUrl}/api/loans/upload-receipt`;

  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(uploadUrl, {
    method: 'POST',
    headers,
    body: formData,
  });

  const resJson = await response.json();
  if (!response.ok || !resJson.success) {
    throw new Error(resJson.error || 'Failed to upload receipt photo.');
  }

  return resJson.data.receiptUrl;
}
