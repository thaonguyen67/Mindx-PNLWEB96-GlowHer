import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { FilterGroup, FilterCheck } from '../components/FilterControls';
import './GeneratePlan.css';

const GOALS = [
  { val:'lose',     en:'Lose weight',    vi:'Giảm cân' },
  { val:'tone',     en:'Tone & sculpt',  vi:'Săn chắc cơ thể' },
  { val:'strength', en:'Build strength', vi:'Tăng sức mạnh' },
  { val:'glutes',   en:'Glutes & legs',  vi:'Mông & chân' },
  { val:'general',  en:'General fitness',vi:'Thể lực tổng quát' },
];
const AREAS = ['legs','glutes','core','back','arms','chest','shoulders','full'];
const WEEKS = [1, 2, 3, 4];

function ZapIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  );
}

function ChevronIcon({ open }) {
  return (
    <svg
      className={`chev${open ? ' open' : ''}`}
      width="16" height="16" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2.2"
    >
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  );
}

function DayCard({ day, lang, t }) {
  const isRest = !day.exercises || day.exercises.length === 0;
  return (
    <div className={`day-card${isRest ? ' rest' : ''}`}>
      <div className="day-card-head">
        <span className="day-num">{t('day_word')} {day.dayNumber}</span>
        <span className="day-focus">{day.focus || (isRest ? (lang === 'vi' ? 'Ngày nghỉ' : 'Rest day') : '')}</span>
      </div>
      {isRest ? (
        <p className="rest-msg">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
          {lang === 'vi' ? 'Hãy để cơ thể hồi phục.' : 'Take time to recover and recharge.'}
        </p>
      ) : (
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
      )}
    </div>
  );
}

function WeekAccordion({ weekNum, days, t, lang, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`week-block${open ? ' open' : ''}`}>
      <button className="week-header" onClick={() => setOpen(o => !o)}>
        <span className="week-label">
          <span className="week-num">{t('week_word')} {weekNum}</span>
        </span>
        <span className="week-meta">{days.length} {t('days_word')}</span>
        <ChevronIcon open={open} />
      </button>
      {open && (
        <div className="week-days">
          {days.map(d => (
            <DayCard key={d.dayNumber} day={d} t={t} lang={lang} />
          ))}
        </div>
      )}
    </div>
  );
}

const DRAFT_KEY = 'glowher_draft_plan';
const PENDING_SAVE_KEY = 'glowher_pending_save';

function restoreDraftPlan() {
  const draft = sessionStorage.getItem(DRAFT_KEY);
  if (!draft) return null;
  try {
    return JSON.parse(draft);
  } catch {
    sessionStorage.removeItem(DRAFT_KEY);
    return null;
  }
}

export default function GeneratePlan() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const formRef = useRef(null);

  const [goal, setGoal]       = useState('');
  const [areas, setAreas]     = useState([]);
  const [weeks, setWeeks]     = useState(null);
  const [loading, setLoading] = useState(false);
  const [plan, setPlan]       = useState(null);
  const [error, setError]     = useState('');
  const [saveError, setSaveError] = useState('');
  const [saved, setSaved]     = useState(false);
  const [saving, setSaving]   = useState(false);

  useEffect(() => {
    const parsed = restoreDraftPlan();
    if (!parsed) return;
    setPlan(parsed);
    if (parsed.goal) setGoal(parsed.goal);
    if (parsed.targetBodyParts?.length) setAreas(parsed.targetBodyParts);
    if (parsed.durationWeeks) setWeeks(parsed.durationWeeks);
  }, []);

  const handleSavePlan = useCallback(async () => {
    if (!plan) return;

    if (!user) {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(plan));
      sessionStorage.setItem(PENDING_SAVE_KEY, '1');
      navigate('/login', { state: { from: '/generate-plan' } });
      return;
    }

    setSaving(true);
    setSaveError('');
    try {
      let planId = plan._id;
      const saveGoal = plan.goal || goal;
      const saveAreas = plan.targetBodyParts?.length ? plan.targetBodyParts : areas;
      const saveWeeks = plan.durationWeeks || weeks;

      if (!planId) {
        const { data } = await api.post('/workout-plans/generate', {
          goal: saveGoal,
          targetBodyParts: saveAreas,
          durationWeeks: saveWeeks,
          daysPerWeek: plan.daysPerWeek || 4,
        });
        planId = data.data._id;
        setPlan(data.data);
      }

      const { data } = await api.post('/users/saved-plans', { planId });
      if (!data?.success) {
        throw new Error(data?.message || (lang === 'vi' ? 'Không thể lưu kế hoạch.' : 'Could not save plan.'));
      }
      updateUser(data.data.user);
      setSaved(true);
      sessionStorage.removeItem(DRAFT_KEY);
      sessionStorage.removeItem(PENDING_SAVE_KEY);
      navigate('/profile');
    } catch (err) {
      setSaveError(
        err.response?.data?.message ||
        err.message ||
        (lang === 'vi' ? 'Không thể lưu kế hoạch.' : 'Could not save plan.')
      );
    } finally {
      setSaving(false);
    }
  }, [plan, user, goal, areas, weeks, lang, navigate, updateUser]);

  useEffect(() => {
    if (!user || !plan) return;
    if (sessionStorage.getItem(PENDING_SAVE_KEY) !== '1') return;
    sessionStorage.removeItem(PENDING_SAVE_KEY);
    handleSavePlan();
  }, [user, plan, handleSavePlan]);

  const toggleArea = (a) =>
    setAreas(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]);

  const toggleGoal = (val) =>
    setGoal(prev => prev === val ? '' : val);

  const toggleWeeks = (w) =>
    setWeeks(prev => prev === w ? null : w);

  const clearAll = () => {
    setGoal('');
    setAreas([]);
    setWeeks(null);
    setError('');
  };

  const hasSettings = goal || areas.length > 0 || weeks != null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!goal) {
      setError(lang === 'vi' ? 'Vui lòng chọn mục tiêu.' : 'Please select a goal.');
      return;
    }
    if (areas.length === 0) {
      setError(lang === 'vi' ? 'Vui lòng chọn ít nhất một vùng tập trung.' : 'Please select at least one target area.');
      return;
    }
    if (!weeks) {
      setError(lang === 'vi' ? 'Vui lòng chọn số tuần.' : 'Please select a duration.');
      return;
    }
    setLoading(true);
    setPlan(null);
    setSaved(false);
    try {
      const { data } = await api.post('/workout-plans/generate', {
        goal,
        targetBodyParts: areas,
        durationWeeks: weeks,
        daysPerWeek: 4,
      });
      setPlan(data.data);
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(data.data));
    } catch (err) {
      setError(
        err.response?.data?.message ||
        (lang === 'vi'
          ? 'Đã có lỗi xảy ra. Vui lòng thử lại.'
          : 'Something went wrong generating your plan. Please try again.')
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = () => {
    setPlan(null);
    setSaved(false);
    setError('');
    sessionStorage.removeItem(DRAFT_KEY);
    sessionStorage.removeItem(PENDING_SAVE_KEY);
  };

  const weekGroups = plan
    ? plan.days.reduce((acc, d) => {
        const w = d.week || 1;
        if (!acc[w]) acc[w] = [];
        acc[w].push(d);
        return acc;
      }, {})
    : {};

  const goalLabel = (g) => {
    const found = GOALS.find(x => x.val === g);
    return found ? (lang === 'vi' ? found.vi : found.en) : g;
  };

  return (
    <main className="container gen-page">
      <div className="page-head">
        <h1>{t('plan_title')}</h1>
        <p>{t('genp_desc')}</p>
      </div>

      <div className="gen-layout">
        {/* ── left: settings ── */}
        <aside className="gen-sidebar card" ref={formRef}>
          <div className="sidebar-head">
            <span className="sidebar-title">{t('plan_settings')}</span>
            {hasSettings && (
              <button type="button" className="clear-btn" onClick={clearAll}>
                {t('clear_all')}
              </button>
            )}
          </div>
          <form onSubmit={handleSubmit}>
            {error && <p className="gen-error">{error}</p>}

            <FilterGroup label={t('your_goal')} activeCount={goal ? 1 : 0}>
              {GOALS.map(g => (
                <FilterCheck
                  key={g.val}
                  checked={goal === g.val}
                  onChange={() => toggleGoal(g.val)}
                  label={lang === 'vi' ? g.vi : g.en}
                />
              ))}
            </FilterGroup>

            <FilterGroup label={t('target_areas')} activeCount={areas.length}>
              {AREAS.map(a => (
                <FilterCheck
                  key={a}
                  checked={areas.includes(a)}
                  onChange={() => toggleArea(a)}
                  label={t('m_' + a)}
                />
              ))}
            </FilterGroup>

            <FilterGroup
              label={lang === 'vi' ? 'Số tuần' : 'Duration'}
              last
              activeCount={weeks ? 1 : 0}
            >
              {WEEKS.map(w => (
                <FilterCheck
                  key={w}
                  checked={weeks === w}
                  onChange={() => toggleWeeks(w)}
                  label={`${w} ${lang === 'vi' ? 'tuần' : w === 1 ? 'week' : 'weeks'}`}
                />
              ))}
            </FilterGroup>

            <button type="submit" className="btn btn-primary btn-block gen-submit" disabled={loading}>
              {loading ? (
                <>
                  <div className="spinner" />
                  {t('generating')}
                </>
              ) : (
                t('generate')
              )}
            </button>
          </form>
        </aside>

        {/* ── right: generated plan ── */}
        <div className="gen-output">
          {loading && (
            <div className="gen-output-panel card gen-output-loading">
              <div className="ai-orb-wrap">
                <div className="ai-orb-ring" />
                <div className="ai-orb" />
                <p className="ai-orb-text">{t('ai_thinking')}</p>
              </div>
            </div>
          )}

          {!loading && !plan && (
            <div className="gen-output-panel card gen-output-empty">
              <div className="gen-empty-icon" aria-hidden="true">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                </svg>
              </div>
              <p>{t('gen_output_empty')}</p>
            </div>
          )}

          {!loading && plan && (
            <div className="plan-result">
              <div className="plan-result-head card">
                <div className="plan-result-meta">
                  <span className="tag tag-rose"><ZapIcon />&nbsp;{t('ai_badge')}</span>
                  <span className="tag tag-char">{goalLabel(plan.goal)}</span>
                  <span className="tag tag-char">
                    {plan.durationWeeks} {lang === 'vi' ? 'tuần' : plan.durationWeeks === 1 ? 'week' : 'weeks'}
                    {' · '}{plan.daysPerWeek} {lang === 'vi' ? 'ngày/tuần' : 'days/wk'}
                  </span>
                </div>
                <h2>{plan.title}</h2>
                {plan.intro && <p className="plan-intro">{plan.intro}</p>}
                {saveError && <p className="gen-error plan-save-error">{saveError}</p>}
                <div className="plan-actions">
                  <button className="btn btn-soft btn-sm" onClick={handleRegenerate}>{t('regenerate')}</button>
                  {!saved ? (
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      disabled={saving}
                      onClick={handleSavePlan}
                    >
                      {saving ? <div className="spinner" /> : t('save_plan')}
                    </button>
                  ) : (
                    <span className="saved-badge">✓ {t('plan_saved')}</span>
                  )}
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

              <div className="weeks-list">
                {Object.keys(weekGroups).sort((a,b) => Number(a)-Number(b)).map((wk, i) => (
                  <WeekAccordion
                    key={wk}
                    weekNum={Number(wk)}
                    days={weekGroups[wk]}
                    t={t}
                    lang={lang}
                    defaultOpen={i === 0}
                  />
                ))}
              </div>

            </div>
          )}
        </div>
      </div>
    </main>
  );
}
