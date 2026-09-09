import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, RotateCw, Users, AlertTriangle, Clock, School,
} from 'lucide-react';
import { useRoster, describeAsOf } from './useSchool';

/**
 * SchoolDashboard: what a teacher or director sees.
 *
 * Everything here comes from class_roster(), which counts only activity inside
 * the caller's own window. A child who transferred in shows the work they did
 * HERE, not what they did at their previous school. That is the whole point of
 * the isolation model, and it is why this cannot read the progress cache.
 *
 * A teacher's class list contains only classes they teach; a director's has
 * every class in their school. Neither is filtered here: the database decides,
 * so a UI bug cannot widen access.
 */

function RosterTable({ rows }) {
  if (!rows?.length) {
    return (
      <p className="sch-empty">
        No pupils yet. They appear here once a parent registers their child and
        picks this class.
      </p>
    );
  }
  return (
    <div className="sch-scroll">
      <table className="sch-table">
        <thead>
          <tr>
            <th>Pupil</th>
            <th>Age</th>
            <th>Words</th>
            <th>Missed</th>
            <th>Struggles with</th>
            <th>Last seen</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.student_id}>
              <td data-label="Pupil"><strong>{r.display_name}</strong></td>
              <td data-label="Age">{r.age_years ?? '-'}</td>
              <td data-label="Words">{r.words ?? 0}</td>
              <td data-label="Missed">{r.misses ?? 0}</td>
              <td data-label="Struggles with">
                {r.top_missed
                  ? <span className="sch-phoneme">{r.top_missed}</span>
                  : <span className="sch-muted">-</span>}
              </td>
              <td data-label="Last seen">
                {r.last_active
                  ? new Date(r.last_active).toLocaleDateString()
                  : <span className="sch-muted">not yet</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function SchoolDashboard({ schools, classes, onBack }) {
  const [classId, setClassId] = useState(classes[0]?.class_id || '');
  const { rows, asOf, stale, error, reload } = useRoster(classId);

  useEffect(() => {
    if (!classId && classes.length) setClassId(classes[0].class_id);
  }, [classes, classId]);

  const current = classes.find((c) => c.class_id === classId);
  const isDirector = schools.some((s) => s.role === 'director');

  return (
    <div className="screen">
      <div className="screen-header" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <button className="btn btn-ghost p-2" onClick={onBack} aria-label="Go back">
          <ArrowLeft size={24} />
        </button>
        <h2 style={{ margin: 0 }}>
          {schools[0]?.name || 'Your school'}
        </h2>
      </div>

      <div className="sch-wrap">
        <p className="sch-role">
          <School size={16} />
          {isDirector
            ? 'You are a director, so you see every class in your school.'
            : 'You see the classes you teach.'}
        </p>

        {classes.length === 0 ? (
          <p className="sch-empty">
            You are not assigned to any class yet. Your director can add you to
            one.
          </p>
        ) : (
          <>
            <div className="sch-bar">
              <label className="auth-label" htmlFor="sch-class" style={{ margin: 0 }}>
                Class
              </label>
              <select id="sch-class" className="auth-input sch-select"
                      value={classId} onChange={(e) => setClassId(e.target.value)}>
                {classes.map((c) => (
                  <option key={c.class_id} value={c.class_id}>
                    {c.class_name}
                    {c.academic_year ? ` (${c.academic_year})` : ''}
                    {' · '}{c.student_count} pupil{Number(c.student_count) === 1 ? '' : 's'}
                  </option>
                ))}
              </select>
              <button className="btn-resend sch-refresh" onClick={reload}
                      aria-label="Refresh">
                <RotateCw size={16} />
              </button>
            </div>

            {/* Stale data with an honest timestamp beats an empty screen: a
                school connection drops often, and a blank page reads as a
                broken app rather than a slow line. */}
            {asOf && (
              <p className={`sch-asof${stale ? ' is-stale' : ''}`}>
                <Clock size={14} /> {describeAsOf(asOf, stale)}
              </p>
            )}

            {error && <p role="alert" className="auth-error">{error}</p>}

            <div className="sch-summary">
              <div className="sch-stat">
                <Users size={18} />
                <span className="sch-stat-n">{rows?.length ?? 0}</span>
                <span className="sch-stat-l">pupils using the app</span>
              </div>
              <div className="sch-stat">
                <AlertTriangle size={18} />
                <span className="sch-stat-n">
                  {rows?.filter((r) => (r.misses || 0) > 0).length ?? 0}
                </span>
                <span className="sch-stat-l">need help with a sound</span>
              </div>
            </div>

            <h3 className="sch-h3">{current?.class_name || 'Class'}</h3>
            <RosterTable rows={rows} />

            <p className="sch-note">
              Counts cover the time this pupil has been at your school. Work
              done elsewhere is not shown.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
