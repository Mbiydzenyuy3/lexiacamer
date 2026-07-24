import { Cat, Dog, Bird, Snail } from 'lucide-react';

/**
 * Single source of truth for learner avatars.
 * Used by Onboarding (the picker) and App (the top-bar icon). Add or change
 * avatars here only — keeping one list prevents the two screens from drifting
 * out of sync (which is how an unknown avatar id could crash the header).
 */
export const AVATARS = [
  { id: 'lion',     icon: Cat,   color: '#f59e0b', bg: '#fffbeb', label: 'Lion' },
  { id: 'parrot',   icon: Bird,  color: '#0ea5e9', bg: '#f0f9ff', label: 'Parrot' },
  { id: 'tortoise', icon: Snail, color: '#059669', bg: '#ecfdf5', label: 'Tortoise' },
  { id: 'dog',      icon: Dog,   color: '#6366f1', bg: '#eef2ff', label: 'Dog' },
];

/**
 * Resolve an avatar id to its icon component. Falls back to `fallback` for an
 * unknown id (e.g. stale/hand-edited persisted state, or an avatar removed in a
 * later version) so the caller never renders `undefined`.
 */
export function getAvatarIcon(id, fallback) {
  return AVATARS.find((a) => a.id === id)?.icon || fallback;
}
