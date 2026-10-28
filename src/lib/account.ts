import type { User } from './types';

/** Approved and not paused by the affiliate team: active, or paused by the affiliate themselves. */
const isSelfManaged = (user: User) =>
  user.status === 'active' || (user.status === 'deactivated' && user.deactivatedBy === 'affiliate');

/**
 * Whether the user can add or change payout details. Mirrors the server rule in
 * updatePayoutMethod; the server enforces it, this only decides what to show.
 */
export const canManagePayouts = isSelfManaged;

/** Whether the user can pause or resume their own account (not after the team has paused it). */
export const canChangeOwnStatus = isSelfManaged;
