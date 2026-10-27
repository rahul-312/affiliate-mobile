/** Response shapes of the affiliate-backend API. Amounts are integer paise, rates integer basis points. */

export type UserStatus = 'pending' | 'active' | 'rejected';
export type CommissionStatus = 'pending' | 'approved' | 'rejected' | 'processing' | 'paid';
export type PromotionChannel = 'instagram' | 'youtube' | 'website' | 'messaging' | 'other';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'affiliate' | 'ops' | 'finance';
  status: UserStatus;
  createdAt: string;
  promotionChannel?: PromotionChannel | null;
  rejectionReason?: string | null;
  referralCode?: string | null;
  referralLinkActive?: boolean;
  referralLink?: string | null;
  payoutMethod?: { type: 'upi' | 'bank'; masked: string; updatedAt: string } | null;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Program {
  name: string;
  headline: string;
  rateBps: number;
  qualifyingRules: string[];
  payoutSchedule: string;
  minPayoutPaise: number;
  steps: string[];
  currency: 'INR';
}

export interface Summary {
  pendingPaise: number;
  approvedPaise: number;
  processingPaise: number;
  paidPaise: number;
  rejectedPaise: number;
  availableForNextPayoutPaise: number;
  minPayoutPaise: number;
  hasPayoutDetails: boolean;
  needsPayoutDetails: boolean;
  belowMinimum: boolean;
  commissionCount: number;
}

export interface Commission {
  id: string;
  orderAmountPaise: number;
  rateBps: number;
  amountPaise: number;
  status: CommissionStatus;
  rejectionReason: string | null;
  retried: boolean;
  retryNote: string | null;
  createdAt: string;
}

export interface Payout {
  batchId: string;
  batchNo: string;
  amountPaise: number;
  commissionCount: number;
  paidAt: string;
  paymentReference: string;
}

export interface Page<T> {
  items: T[];
  total: number;
}

export type PayoutMethodInput =
  | { type: 'upi'; upiId: string }
  | { type: 'bank'; accountName: string; accountNumber: string; ifsc: string };
