import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import ProgressBar from './ProgressBar';
import './PlanPreviewModal.css';

function ZapIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  );
}

function ChevronIcon({ open }) {
  return (
    <svg className={`chev${open ? ' open' : ''}`} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  );
}

function DayRow({ day, done, lang, t }) {
  const isRest = !day.exercises || day.exercises.length === 0;
  const [open, setOpen] = useState(false);

  return (
    <div className={`pd-day${done ? ' done' : ''}${isRest ? ' rest' : ''}`}>
      <div className="pd-day-head" onClick={() => !isRest && setOpen(o => !o)}>
        <div className="pd-day-left">
          <span className="pd-day-num">{t('day_word')} {day.dayNumber}</span>
          <span className="pd-day-focus">{day.focus || (isRest ? (lang === 'vi' ? 'Ngày nghỉ' : 'Rest day') : '')}</span>
          {done && (
            <span className="pd-done-chip">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              {lang === 'vi' ? 'Hoàn thành' : 'Done'}
            </span>
          )}
        </div>
        <div className="pd-day-right">
          {!isRest && <ChevronIcon open={open} />}
        </div>
      </div>

      {open && !isRest && (
        <div className="pd-day-body">
          <table className="ex-table">
            <thead>
              <tr>
                <th>{lang === 'vi' ? 'Bài tập' : 'Exercise'}</th>
                <th>{lang === 'vi' ? 'Hiệp' : 'Sets'}</th>
                <th>{lang === 'vi' ? 'Lần' : 'Reps'}</th>
                <th>{lang === 'vi' ? 'Nghỉ' : 'Rest'}</th>
              </tr>
            </thead>
            <tbody>
              {day.exercises.map((ex, i) => (
                <tr key={i} className={i % 2 === 1 ? 'alt' : ''}>
                  <td>{ex.exerciseName}</td>
                  <td>{ex.sets}</td>
                  <td>{ex.reps}</td>
                  <td>{ex.rest || '60s'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function WeekSection({ weekNum, days, loggedDays, lang, t }) {
  const [open, setOpen] = useState(true);
  const doneCnt = days.filter(d => loggedDays.has(d.dayNumber)).length;

  return (
    <div className={`pd-week${open ? ' open' : ''}`}>
      <button type="button" className="pd-week-head" onClick={() => setOpen(o => !o)}>
        <span className="pd-week-label">
          <span className="pd-week-num">{t('week_word')} {weekNum}</span>
          <span className="pd-week-prog">{doneCnt}/{days.length} {lang === 'vi' ? 'buổi' : 'days'}</span>
        </span>
        <ChevronIcon open={open} />
      </button>
      {open && (
        <div className="pd-week-days">
          {days.map(d => (
            <DayRow
              key={d.dayNumber}
              day={d}
              done={loggedDays.has(d.dayNumber)}
              lang={lang}
              t={t}
            />
          ))}
        </div>
      )}
    </div>
  );
}

const GOAL_MAP = {
  en: { lose: 'Lose weight', tone: 'Tone & sculpt', strength: 'Build strength', glutes: 'Glutes & legs', general: 'General fitness' },
  vi: { lose: 'Giảm cân', tone: 'Săn chắc', strength: 'Tăng sức mạnh', glutes: 'Mông & chân', general: 'Thể lực tổng quát' },
};

export default function PlanPreviewModal({ planId, onClose }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;

  const [plan, setPlan] = useState(null);
  const [loggedDays, setLoggedDays] = useState(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      api.get(`/workout-plans/${planId}`),
      api.get(`/workout-logs/plan/${planId}`),
    ])
      .then(([p, l]) => {
        if (cancelled) return;
        setPlan(p.data.data);
        setLoggedDays(new Set((l.data.data || []).map(log => log.dayNumber)));
      })
      .catch(console.error)
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [planId]);

  const goalLabel = (goal) => {
    const map = lang === 'vi' ? GOAL_MAP.vi : GOAL_MAP.en;
    return map[goal] || goal;
  };

  const weekGroups = (plan?.days || []).reduce((acc, d) => {
    const w = d.week || 1;
    if (!acc[w]) acc[w] = [];
    acc[w].push(d);
    return acc;
  }, {});

  const totalDays = plan?.days?.length || 0;
  const completed = loggedDays.size;

  return (
    <div className="plan-modal-overlay" onClick={onClose} role="presentation">
      <div
        className="plan-modal-box"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="plan-modal-title"
      >
        <button type="button" className="plan-modal-close" onClick={onClose} aria-label={t('close')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>

        {loading ? (
          <div className="plan-modal-loading">
            <div className="spinner" style={{ width: 32, height: 32, borderColor: 'var(--rose-soft)', borderTopColor: 'var(--rose)' }} />
          </div>
        ) : !plan ? (
          <p className="plan-modal-error">{lang === 'vi' ? 'Không tìm thấy kế hoạch.' : 'Plan not found.'}</p>
        ) : (
          <div className="plan-modal-content">
            <div className="pd-header card">
              <div className="pd-header-meta">
                {plan.type === 'ai'
                  ? <span className="tag tag-rose"><ZapIcon />&nbsp;AI</span>
                  : <span className="tag tag-char">Preset</span>}
                <span className="tag tag-char">{goalLabel(plan.goal)}</span>
                <span className="tag tag-char">
                  {plan.durationWeeks} {lang === 'vi' ? 'tuần' : plan.durationWeeks === 1 ? 'week' : 'weeks'}
                  {' · '}{plan.daysPerWeek} {lang === 'vi' ? 'ngày/tuần' : 'days/wk'}
                </span>
              </div>
              <h1 id="plan-modal-title">{plan.title}</h1>
              {plan.intro && <p className="pd-intro">{plan.intro}</p>}

              <div className="pd-prog-section">
                <div className="pd-prog-labels">
                  <span className="pd-prog-title">
                    {lang === 'vi' ? 'Tiến độ tổng thể' : 'Overall progress'}
                  </span>
                  <span className="pd-prog-frac">
                    <strong>{completed}</strong> / {totalDays} {lang === 'vi' ? 'buổi' : 'days'}
                  </span>
                </div>
                <ProgressBar completed={completed} total={totalDays} showLabel={false} />
              </div>
            </div>

            {plan.tip && (
              <div className="coach-tip">
                <span className="coach-tip-label">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  {t('coach_tip')}
                </span>
                <p>{plan.tip}</p>
              </div>
            )}

            <div className="pd-weeks">
              {Object.keys(weekGroups).sort((a, b) => Number(a) - Number(b)).map(wk => (
                <WeekSection
                  key={wk}
                  weekNum={Number(wk)}
                  days={weekGroups[wk]}
                  loggedDays={loggedDays}
                  lang={lang}
                  t={t}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
