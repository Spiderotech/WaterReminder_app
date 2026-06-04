import { backendRequest, getBackendUserId } from './backendAuthService';

export type UserVoucher = {
  _id: string;
  code: string;
  title: string;
  provider: string;
  category?: string;
  valueLabel?: string | null;
  redemptionUrl?: string | null;
  platformLogoUrl?: string | null;
  terms?: string;
  competitionId?: string | null;
  status: 'assigned' | 'downloaded' | 'used' | 'expired' | 'available';
  expiresAt?: string | null;
  assignedAt?: string | null;
  downloadedAt?: string | null;
  createdAt?: string;
};

export const getMyVouchers = async (): Promise<UserVoucher[]> => {
  const userId = await getBackendUserId();
  if (!userId) return [];

  const query = new URLSearchParams({ userId });
  const data = await backendRequest(`/vouchers/my?${query.toString()}`);
  return data.vouchers || [];
};

export const markVoucherDownloaded = async (voucherId: string) => {
  const userId = await getBackendUserId();
  if (!userId) {
    throw new Error('Login is required to download this voucher.');
  }

  const data = await backendRequest(`/vouchers/${voucherId}/downloaded`, {
    method: 'POST',
    body: JSON.stringify({ userId }),
  });

  return data.voucher as UserVoucher;
};
