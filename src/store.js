/**
 * store: local persistence and the offline outbox.
 *
 * The child's device is the origin of every fact about their learning. It
 * records EVENTS ("completed a word"), keeps a running local view so stars move
 * instantly with no network, and queues those events until the server accepts
 * them. The server then recomputes from the same events and is authoritative
 * for what adults see.
 *
 * Nothing here requires a backend: with no Supabase configured the outbox
 * simply never drains, and the app behaves exactly as it does today.
 */

import {
  emptyProgress, applyEvent, makeEvent, deriveProgress,
} from './scoring';
import { supabase, isBackendConfigured } from './lib/supabase';

const STORAGE_KEY = 'lexia_state_v2';
const LEGACY_KEY = 'lexia_state';

/** Events older than this are dropped from the outbox: the server would
 *  refuse them anyway (they predate the current device grant). */
const OUTBOX_MAX_AGE_DAYS = 60;
/** Matches the server's per-call cap in sync_activity(). */
export const SYNC_BATCH_LIMIT = 500;

/**
 * The server says this parent no longer has this child: it was deleted, from
 * this phone or another. Distinct from "not authenticated" (an expired
 * session), which must NOT drop the link: re-consenting after that would
 * create the same child a second time.
 */
export const isGoneOnServer = (err) =>
  err?.code === '42501'
  && /not a guardian|no current access/i.test(err?.message || '');

export function defaultState() {
  return {
    version: 2,
    lang: 'en',
    settings: { dyslexiaMode: false },
    user: { name: '', avatar: '' },
    progress: { ...emptyProgress(), _rounds: 0, _lastMissAt: null },
    outbox: [],
    studentId: null,
    deviceToken: null,
    lastSyncedAt: null,
    // When the parent finished the three onboarding steps. Null means they
    // have not, so the dashboard shows onboarding first.
    onboardedAt: null,
    // The parent's consent and the child's own OK, for THIS phone's child.
    // Null until asked. Nothing is linked to the server until childAssent is
    // true; the server refuses too (0021), this just avoids the round trip.
    consent: null,
  };
}

/**
 * Carry a v1 (pre-backend) save forward. Existing users have stars and
 * stickers in the old shape; losing them on upgrade would be a visible
 * regression for a child.
 */
export function migrateLegacy(legacy) {
  const base = defaultState();
  if (!legacy || typeof legacy !== 'object') return base;
  return {
    ...base,
    lang: legacy.lang || base.lang,
    settings: { ...base.settings, ...(legacy.settings || {}) },
    user: { ...base.user, ...(legacy.user || {}) },
    progress: {
      ...emptyProgress(),
      words: legacy.stats?.words || 0,
      streak: legacy.stats?.streak || 0,
      stars: legacy.stats?.stars || 0,
      unlockedStickers: Array.isArray(legacy.unlockedStickers)
        ? legacy.unlockedStickers : [],
      missedPhonemes: legacy.missedPhonemes || {},
      // The old save has no event history, so the star total is taken as
      // given and future events accumulate on top of it.
      _rounds: 0,
      _lastMissAt: null,
      _legacyStars: legacy.stats?.stars || 0,
    },
  };
}

export function loadState() {
  const base = defaultState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...base,
        ...parsed,
        settings: { ...base.settings, ...(parsed.settings || {}) },
        user: { ...base.user, ...(parsed.user || {}) },
        progress: { ...base.progress, ...(parsed.progress || {}) },
        outbox: Array.isArray(parsed.outbox) ? parsed.outbox : [],
      };
    }
    const legacyRaw = localStorage.getItem(LEGACY_KEY);
    if (legacyRaw) return migrateLegacy(JSON.parse(legacyRaw));
  } catch {
    /* corrupt or unavailable storage: start clean rather than crash */
  }
  return base;
}

export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* storage full or blocked: the app still works from memory */
  }
}

/**
 * Record something the child did: update the local view immediately and queue
 * the event for the server. Pure: returns the next state, so React owns it.
 */
export function queueEvent(state, kind, payload = {}) {
  const event = makeEvent(kind, payload);
  return {
    ...state,
    progress: applyEvent(state.progress, event),
    outbox: [...state.outbox, event],
  };
}

/** Drop events the server would reject anyway, so the queue cannot grow without bound. */
export function pruneOutbox(outbox, now = Date.now()) {
  const cutoff = now - OUTBOX_MAX_AGE_DAYS * 86_400_000;
  const kept = outbox.filter(e => new Date(e.occurred_at).getTime() >= cutoff);
  // Same reference when nothing was dropped, so callers can cheaply tell that
  // nothing changed and avoid a pointless state update.
  return kept.length === outbox.length ? outbox : kept;
}

/**
 * Push queued events to the server.
 *
 * Returns the next state. Events are only dropped from the outbox once the
 * server has ACCEPTED them: a failed or offline sync leaves the queue intact
 * so nothing a child did is ever lost to a bad connection.
 */
export async function syncOutbox(state) {
  if (!isBackendConfigured || !supabase) return state;
  if (!state.deviceToken || state.outbox.length === 0) return state;
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return state;

  const pending = pruneOutbox(state.outbox);
  const batch = pending.slice(0, SYNC_BATCH_LIMIT);

  try {
    const { error } = await supabase.rpc('sync_activity', {
      p_token: state.deviceToken,
      p_events: batch,
    });
    // A dead token (child deleted, or grant expired): drop it and keep the
    // events. The next link re-issues a grant, or learns the child is gone.
    if (error?.code === '42501' && /invalid device token/i.test(error.message || '')) {
      return { ...state, deviceToken: null, outbox: pending };
    }
    if (error) return pending === state.outbox ? state : { ...state, outbox: pending };

    const sent = new Set(batch.map(e => e.id));
    return {
      ...state,
      outbox: pending.filter(e => !sent.has(e.id)),
      lastSyncedAt: new Date().toISOString(),
    };
  } catch {
    // Network died mid-flight. Keep everything queued and try again later.
    // Returning the SAME state object when nothing changed matters: the caller
    // re-runs on state change, so a new object here would spin forever.
    return pending === state.outbox ? state : { ...state, outbox: pending };
  }
}

/**
 * Merge the server's progress into the phone's.
 *
 * The phone is where every event starts, and the server never sees events from
 * before consent (0002 drops anything older than the device grant). So after
 * linking or re-consenting the server knows LESS than the phone, and adopting
 * it outright would take stars away from a child: the consent screen promises
 * the opposite. Each total is the larger of the two; stickers and missed
 * sounds are combined. The server still wins on a phone that lost its data
 * (a reinstall), because there the phone has less.
 */
export function reconcile(state, serverProgress) {
  if (!serverProgress) return state;
  const base = {
    ...emptyProgress(),
    words: serverProgress.words ?? 0,
    streak: serverProgress.streak ?? 0,
    stars: serverProgress.stars ?? 0,
    unlockedStickers: serverProgress.unlocked_stickers ?? [],
    missedPhonemes: serverProgress.missed_phonemes ?? {},
    _rounds: 0,
    _lastMissAt: null,
  };
  const server = state.outbox.reduce(applyEvent, base);
  const local = state.progress;
  const missed = { ...server.missedPhonemes };
  for (const [k, v] of Object.entries(local.missedPhonemes || {})) {
    missed[k] = Math.max(missed[k] || 0, v);
  }
  return {
    ...state,
    progress: {
      ...server,
      words: Math.max(server.words, local.words || 0),
      stars: Math.max(server.stars, local.stars || 0),
      streak: Math.max(server.streak, local.streak || 0),
      unlockedStickers: [...new Set([...(local.unlockedStickers || []), ...server.unlockedStickers])],
      missedPhonemes: missed,
    },
  };
}

/** Re-derive from a full event list. Used after an export/restore. */
export function progressFromEvents(events) {
  return deriveProgress(events);
}

/**
 * Link the child on this device to the signed-in adult's account.
 *
 * Creates the student server-side (which atomically creates the guardianship,
 * so nobody can attach themselves to an existing child) and mints a device
 * grant: the append-only, read-nothing credential that lets the outbox drain.
 *
 * Idempotent: once linked it returns the state untouched, so it is safe to
 * call on every sign-in.
 */
export async function linkChild(state) {
  // No child is created on the server without the parent's consent AND the
  // child's own OK (Cameroon Law 2024/017; enforced again in create_student).
  if (!state.consent?.childAssent) return state;
  if (!isBackendConfigured || !supabase) return state;
  if (!state.user?.name) return state;           // no child set up yet
  if (state.studentId && state.deviceToken) return state;

  try {
    let studentId = state.studentId;

    if (!studentId) {
      const { data, error } = await supabase.rpc('create_student', {
        p_name: state.user.name,
        p_avatar: state.user.avatar || 'lion',
        p_consent_version: state.consent.version,
        p_child_assent: true,
      });
      if (error) return state;
      studentId = data;
    }

    const { data: token, error: tokenError } = await supabase.rpc(
      'issue_device_grant', { p_student_id: studentId }
    );
    // The child is gone on the server (deleted here or elsewhere): forget the
    // link so the phone stops retrying and the parent can be asked again.
    if (isGoneOnServer(tokenError)) return forgetServerLink(state);
    // Otherwise keep the student id even if the token failed: the next attempt
    // reuses it rather than creating a duplicate child.
    if (tokenError) return { ...state, studentId };

    return { ...state, studentId, deviceToken: token };
  } catch {
    return state;
  }
}

/**
 * Drop everything that ties this phone to a server record, after the parent
 * deleted it. The child's stars and history on the phone stay: deleting the
 * server copy must never look like punishing the child.
 */
export function forgetServerLink(state) {
  return {
    ...state,
    studentId: null,
    deviceToken: null,
    outbox: [],
    lastSyncedAt: null,
    onboardedAt: null,
    consent: null,
  };
}

/**
 * Erase this phone's child. When the phone is linked, the server copy goes
 * first: resetting only the phone would strand a record the parent can no
 * longer reach from here. Keeps language and settings, like before.
 */
export async function eraseChild(state, { online, deleteServer }) {
  if (state.studentId) {
    if (!online) throw new Error('offline');
    try {
      await deleteServer(state.studentId);
    } catch (err) {
      // Already deleted (from another phone, say): nothing left to strand.
      if (!isGoneOnServer(err)) throw err;
    }
  }
  return { ...defaultState(), lang: state.lang, settings: state.settings };
}

/**
 * Run linkChild once at a time, and record its result at once.
 *
 * The ids are written to stateRef and to state as soon as linkChild resolves,
 * before anything else awaits. Otherwise an effect re-run in that gap (a
 * token refresh, the network flapping) would start from a state with no
 * studentId and create the child a second time.
 */
export function startLink(ctx, link = linkChild) {
  if (!ctx.linkingRef.current) {
    ctx.linkingRef.current = link(ctx.stateRef.current)
      .then((linked) => {
        ctx.stateRef.current = {
          ...ctx.stateRef.current,
          studentId: linked.studentId,
          deviceToken: linked.deviceToken,
          consent: linked.consent,
        };
        ctx.write(linked);
        return linked;
      })
      .finally(() => { ctx.linkingRef.current = null; });
  }
  return ctx.linkingRef.current;
}

/** Read the server's authoritative progress for this device's child. */
export async function fetchServerProgress(studentId) {
  if (!isBackendConfigured || !supabase || !studentId) return null;
  try {
    const { data, error } = await supabase
      .from('progress').select('*').eq('student_id', studentId).maybeSingle();
    return error ? null : data;
  } catch {
    return null;
  }
}
