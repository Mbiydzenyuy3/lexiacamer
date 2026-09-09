import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, ArrowRight, Check, Search, ShieldCheck } from 'lucide-react';
import { supabase } from '../lib/supabase';

/**
 * ParentOnboarding: the three things we ask a parent after they sign in.
 *
 *   1. The child   name, birth date, gender, and which school and class.
 *   2. The parent  name and phone, so a teacher can reach them.
 *   3. Where you are  optional, and never shown to the school.
 *
 * Ordered child-first on purpose. A parent came here for their child, so the
 * first screen should be about the child; asking for the adult's details up
 * front reads like a form rather than like setting up a game.
 *
 * Step 3 says plainly that the school will not see it. If we are going to ask
 * for a home address at all, the reason and the limit belong on the screen
 * where we ask, not buried in a policy nobody opens.
 */

const GENDERS = [
  { value: 'female', label: 'Girl' },
  { value: 'male', label: 'Boy' },
  { value: 'other', label: 'Other' },
  { value: 'unspecified', label: 'Prefer not to say' },
];

export default function ParentOnboarding({ studentId, initialChildName, onBack, onDone }) {
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // Step 1
  const [childName, setChildName] = useState(initialChildName || '');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('unspecified');
  const [schoolQuery, setSchoolQuery] = useState('');
  const [schools, setSchools] = useState([]);
  const [school, setSchool] = useState(null);
  const [classes, setClasses] = useState([]);
  const [classId, setClassId] = useState('');
  const [searched, setSearched] = useState(false);
  const [suggested, setSuggested] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [focused, setFocused] = useState(false);

  // Step 2
  const [parentName, setParentName] = useState('');
  const [phone, setPhone] = useState('');

  // Step 3
  const [line1, setLine1] = useState('');
  const [neighbourhood, setNeighbourhood] = useState('');
  const [city, setCity] = useState('');
  const [region, setRegion] = useState('');

  // Type-ahead over schools. Name alone is not enough to choose correctly in
  // Cameroon, where school names repeat heavily, so every result shows its town.
  // Opens on focus, not just on typing. Showing nothing until two characters
  // are typed reads as a broken dropdown: there is no way to tell "no results"
  // from "this control does nothing". With an empty query the server returns
  // the schools already on the platform, which is a useful starting list.
  useEffect(() => {
    if (!supabase || school) return undefined;
    if (!focused) return undefined;
    const q = schoolQuery.trim();
    let cancelled = false;
    const timer = setTimeout(async () => {
      // Searches BOTH: verified schools on the platform and names from the
      // directory. on_platform decides what picking one actually does.
      const { data, error: err } = await supabase.rpc('search_schools_all', {
        p_query: q,
      });
      if (cancelled) return;
      if (err) {
        // Swallowing this made a broken backend look identical to "no schools
        // match", which sent us hunting through the UI for a dropdown bug.
        setSchools([]);
        setSearched(true);
        setSearchError(
          /Could not find the function/i.test(err.message || '')
            ? 'School search is not set up on the server yet.'
            : 'We could not search for schools just now.'
        );
        return;
      }
      setSearchError('');
      setSchools(data || []);
      setSearched(true);
    }, 250);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [schoolQuery, school, focused]);

  const pickSchool = useCallback(async (s) => {
    setSchool(s);
    setSchools([]);
    setClassId('');
    setClasses([]);
    if (!supabase) return;
    if (s.on_platform) {
      const { data } = await supabase.rpc('list_classes', { p_school_id: s.id });
      setClasses(data || []);
    }
    // A school that has not joined yet has no classes and no dashboard, so
    // there is no enrolment to make. Record that this family is waiting.
  }, []);

  const saveChild = async () => {
    setError('');
    setBusy(true);
    try {
      await supabase.rpc('update_student_details', {
        p_student_id: studentId,
        p_name: childName,
        p_dob: dob || null,
        p_gender: gender,
      });
      if (school && !school.on_platform && school.directory_id) {
        await supabase.rpc('note_school_interest', {
          p_directory_id: school.directory_id,
          p_student_id: studentId,
        });
      }
      if (classId) {
        const { error: err } = await supabase.rpc('claim_school_place', {
          p_student_id: studentId,
          p_class_id: classId,
        });
        // P0001 is "already has an active enrolment", which is fine here: it
        // means they went back and forward through this step.
        if (err && !String(err.message || '').includes('already has an active')) {
          throw err;
        }
      }
      setStep(2);
    } catch (e) {
      setError('We could not save that. Check your connection and try again.');
    } finally {
      setBusy(false);
    }
  };

  const saveParent = async () => {
    setError('');
    setBusy(true);
    try {
      await supabase.rpc('update_my_profile', {
        p_full_name: parentName,
        p_phone: phone,
      });
      setStep(3);
    } catch {
      setError('We could not save that. Check your connection and try again.');
    } finally {
      setBusy(false);
    }
  };

  const saveAddress = async (skip = false) => {
    setError('');
    setBusy(true);
    try {
      if (!skip && (line1 || neighbourhood || city || region)) {
        const { data: userData } = await supabase.auth.getUser();
        await supabase.from('guardian_addresses').upsert({
          profile_id: userData?.user?.id,
          line1: line1 || null,
          neighbourhood: neighbourhood || null,
          city: city || null,
          region: region || null,
          updated_at: new Date().toISOString(),
        });
      }
      onDone();
    } catch {
      setError('We could not save that. You can add it later from settings.');
    } finally {
      setBusy(false);
    }
  };

  const canContinueChild = childName.trim().length > 0;

  return (
    <div className="screen">
      {/* The app chrome is hidden on this flow, so this is the only way out. */}
      <div className="focus-back">
        <button className="btn btn-ghost p-2" onClick={onBack} aria-label="Go back">
          <ArrowLeft size={24} />
        </button>
      </div>

      <div className="auth-card">
        <div className="onb-steps" aria-label={`Step ${step} of 3`}>
          {[1, 2, 3].map((n) => (
            <span key={n} className={`onb-dot${n === step ? ' is-active' : ''}${n < step ? ' is-done' : ''}`}>
              {n < step ? <Check size={14} /> : n}
            </span>
          ))}
        </div>

        {step === 1 && (
          <>
            <h2 className="onb-title">About your child</h2>
            <p className="onb-sub">This is what their teacher will see.</p>

            <label className="auth-label" htmlFor="onb-child">Child&apos;s name</label>
            <input id="onb-child" className="auth-input" value={childName}
                   onChange={(e) => setChildName(e.target.value)} maxLength={40}
                   placeholder="Ada" />

            <label className="auth-label" htmlFor="onb-dob" style={{ marginTop: '1rem' }}>
              Date of birth
            </label>
            <input id="onb-dob" type="date" className="auth-input" value={dob}
                   onChange={(e) => setDob(e.target.value)} />

            <fieldset className="onb-fieldset">
              <legend className="auth-label">Gender</legend>
              <div className="onb-chips">
                {GENDERS.map((g) => (
                  <button key={g.value} type="button"
                          className={`onb-chip${gender === g.value ? ' is-selected' : ''}`}
                          onClick={() => setGender(g.value)}>
                    {g.label}
                  </button>
                ))}
              </div>
            </fieldset>

            <label className="auth-label" htmlFor="onb-school" style={{ marginTop: '1rem' }}>
              Their school
            </label>
            {school ? (
              <div className="onb-picked">
                <span>
                  <strong>{school.name}</strong>{school.town ? `, ${school.town}` : ''}
                  {!school.on_platform && (
                    <em className="onb-notjoined">
                      Not using LexiaCamer yet. We will let you know when they
                      join, and your child can keep playing meanwhile.
                    </em>
                  )}
                </span>
                <button type="button" className="btn btn-ghost"
                        onClick={() => { setSchool(null); setClasses([]); setClassId(''); }}>
                  Change
                </button>
              </div>
            ) : (
              <>
                <div className="onb-search">
                  <Search size={16} />
                  <input id="onb-school" className="auth-input" value={schoolQuery}
                         onChange={(e) => setSchoolQuery(e.target.value)}
                         onFocus={() => setFocused(true)}
                         role="combobox"
                         aria-expanded={schools.length > 0}
                         aria-autocomplete="list"
                         autoComplete="off"
                         placeholder="Tap to see schools, or type to search" />
                </div>
                {schools.length > 0 && (
                  <ul className="onb-results">
                    {schools.map((s) => (
                      <li key={s.directory_id || s.id}>
                        <button type="button" onClick={() => pickSchool(s)}>
                          <span className="onb-result-row">
                            <strong>{s.name}</strong>
                            {s.on_platform && <span className="onb-badge">On LexiaCamer</span>}
                          </span>
                          {s.town && <span className="onb-town">{s.town}</span>}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {/* Silence reads as broken. Say what happened, and give them
                    a way forward that does not invent an unverified school. */}
                {searchError && (
                  <p role="alert" className="auth-error">{searchError}</p>
                )}
                {!searchError && searched && schools.length === 0
                  && schoolQuery.trim().length >= 1 && (
                  suggested ? (
                    <p className="onb-hint onb-thanks">
                      Thank you. We will reach out to
                      {' '}<strong>{schoolQuery.trim()}</strong>. You can carry on
                      without a school for now and add it once they join.
                    </p>
                  ) : (
                    <div className="onb-noresult">
                      <p style={{ margin: '0 0 0.6rem' }}>
                        We could not find <strong>{schoolQuery.trim()}</strong>.
                        Tell us the name and we will add it.
                      </p>
                      <button type="button" className="btn-resend"
                              onClick={async () => {
                                try {
                                  await supabase.rpc('suggest_school', {
                                    p_name: schoolQuery.trim(), p_town: null,
                                  });
                                } catch { /* a lead is best-effort */ }
                                setSuggested(true);
                              }}>
                        Tell us about this school
                      </button>
                    </div>
                  )
                )}
                <p className="onb-hint">
                  Not at school yet? Leave this blank. You can add it any time.
                </p>
              </>
            )}

            {school && classes.length > 0 && (
              <>
                <label className="auth-label" htmlFor="onb-class" style={{ marginTop: '1rem' }}>
                  Their class
                </label>
                <select id="onb-class" className="auth-input" value={classId}
                        onChange={(e) => setClassId(e.target.value)}>
                  <option value="">Choose a class</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </>
            )}

            <button className="btn btn-primary onb-next" onClick={saveChild}
                    disabled={busy || !canContinueChild}>
              {busy ? 'Saving...' : 'Continue'} <ArrowRight size={18} />
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="onb-title">About you</h2>
            <p className="onb-sub">
              So their teacher knows who to contact. Your school sees your name
              and phone number, nothing else.
            </p>

            <label className="auth-label" htmlFor="onb-parent">Your name</label>
            <input id="onb-parent" className="auth-input" value={parentName}
                   onChange={(e) => setParentName(e.target.value)} maxLength={120}
                   placeholder="Ngozi Mbeki" />

            <label className="auth-label" htmlFor="onb-phone" style={{ marginTop: '1rem' }}>
              Phone number
            </label>
            <input id="onb-phone" type="tel" inputMode="tel" className="auth-input"
                   value={phone} onChange={(e) => setPhone(e.target.value)}
                   maxLength={32} placeholder="+237 6 00 00 00 00" />

            <div className="onb-actions">
              <button className="btn btn-ghost" onClick={() => setStep(1)} disabled={busy}>
                <ArrowLeft size={18} /> Back
              </button>
              <button className="btn btn-primary" onClick={saveParent} disabled={busy}>
                {busy ? 'Saving...' : 'Continue'} <ArrowRight size={18} />
              </button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h2 className="onb-title">Where you are</h2>
            <p className="onb-sub onb-private">
              <ShieldCheck size={16} />
              <span>
                Your school will <strong>not</strong> see this. It is only used
                to understand which parts of Cameroon we serve. You can skip it.
              </span>
            </p>

            <label className="auth-label" htmlFor="onb-city">Town or city</label>
            <input id="onb-city" className="auth-input" value={city}
                   onChange={(e) => setCity(e.target.value)} placeholder="Douala" />

            <label className="auth-label" htmlFor="onb-hood" style={{ marginTop: '1rem' }}>
              Neighbourhood
            </label>
            <input id="onb-hood" className="auth-input" value={neighbourhood}
                   onChange={(e) => setNeighbourhood(e.target.value)}
                   placeholder="Bonamoussadi" />

            <label className="auth-label" htmlFor="onb-region" style={{ marginTop: '1rem' }}>
              Region
            </label>
            <input id="onb-region" className="auth-input" value={region}
                   onChange={(e) => setRegion(e.target.value)} placeholder="Littoral" />

            <label className="auth-label" htmlFor="onb-line1" style={{ marginTop: '1rem' }}>
              Street or landmark <span className="onb-optional">(optional)</span>
            </label>
            <input id="onb-line1" className="auth-input" value={line1}
                   onChange={(e) => setLine1(e.target.value)} />

            <div className="onb-actions">
              <button className="btn btn-ghost" onClick={() => saveAddress(true)} disabled={busy}>
                Skip
              </button>
              <button className="btn btn-primary" onClick={() => saveAddress(false)} disabled={busy}>
                {busy ? 'Saving...' : 'Finish'} <Check size={18} />
              </button>
            </div>
          </>
        )}

        {error && <p role="alert" className="auth-error">{error}</p>}
      </div>
    </div>
  );
}
