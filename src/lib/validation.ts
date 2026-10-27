/**
 * Client-side checks for instant feedback. They mirror the server's rules,
 * but the server re-validates everything and is the only authority.
 */

export const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
export const isHttpUrl = (value: string) => /^https?:\/\/[^\s.]+\.[^\s]+$/i.test(value.trim());
export const isUpiId = (value: string) => /^[a-z0-9._-]{2,256}@[a-z][a-z0-9]{1,63}$/.test(value.trim().toLowerCase());
export const isIfsc = (value: string) => /^[A-Z]{4}0[A-Z0-9]{6}$/.test(value.trim().toUpperCase());
export const isAccountNumber = (value: string) => /^\d{9,18}$/.test(value.trim());
export const isAccountName = (value: string) => /^[A-Za-z][A-Za-z .'-]{1,99}$/.test(value.trim());
