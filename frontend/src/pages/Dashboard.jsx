import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import PlanPreviewModal from '../components/PlanPreviewModal';
import './Dashboard.css';

const GOALS = [
  { val: 'lose', en: 'Lose weight', vi: 'Giảm cân' },
  { val: 'tone', en: 'Tone & sculpt', vi: 'Săn chắc cơ thể' },
  { val: 'strength', en: 'Build strength', vi: 'Tăng sức mạnh' },
  { val: 'glutes', en: 'Glutes & legs', vi: 'Mông & chân' },
  { val: 'general', en: 'General fitness', vi: 'Thể lực tổng quát' },
];

function groupDaysByWeek(days) {
  const map = new Map();
  (days || []).forEach(d => {
    const w = d.week || 1;
    if (!map.has(w)) map.set(w, []);
    map.get(w).push(d);
  });
  return [...map.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([week, weekDays]) => ({
      week,
      days: weekDays.sort((a, b) => a.dayNumber - b.dayNumber),
    }));
}

function initialsFromName(name) {
  return (name || 'G')
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function planIdOf(plan) {
  return String(plan?._id || plan?.id || '');
}

function removePlanLog(prev, planId, dayNumber) {
  const key = String(planId);
  return {
    ...prev,
    [key]: (prev[key] || []).filter(l => Number(l.dayNumber) !== Number(dayNumber)),
  };
}

function upsertPlanLog(prev, planId, log) {
  const key = String(planId);
  const list = prev[key] || [];
  const dayNum = Number(log.dayNumber);
  const idx = list.findIndex(l => Number(l.dayNumber) === dayNum);
  const next = idx >= 0
    ? list.map((l, i) => (i === idx ? log : l))
    : [...list, log];
  return { ...prev, [key]: next.sort((a, b) => a.dayNumber - b.dayNumber) };
}

export default function Dashboard() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const location = useLocation();

  const [savedPlans, setSavedPlans] = useState([]);
  const [planLogs, setPlanLogs] = useState({});
  const [ranking, setRanking] = useState([]);
  const [myWeekTotal, setMyWeekTotal] = useState(0);
  const [totalParticipants, setTotalParticipants] = useState(0);
  const [myRank, setMyRank] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [logLoading, setLogLoading] = useState(null);
  const [previewPlanId, setPreviewPlanId] = useState(null);
  const [toast, setToast] = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3200); };

  const goalLabel = (g) => {
    const found = GOALS.find(x => x.val === g);
    return found ? (lang === 'vi' ? found.vi : found.en) : g;
  };
  const areaLabel = (a) => t('m_' + a);

  const applyRankingData = (rankData) => {
    setRanking(rankData?.ranking || []);
    setMyWeekTotal(rankData?.myWeekTotal || 0);
    setTotalParticipants(rankData?.totalParticipants || 0);
    setMyRank(rankData?.myRank ?? rankData?.myStats?.rank ?? null);
  };

  useEffect(() => {
    let cancelled = false;

    const loadPlanLogs = async (plans) => {
      const logs = {};
      const results = await Promise.allSettled(
        plans.map(async p => {
          const planId = p?._id || p?.id;
          if (!planId) return null;
          const r = await api.get(`/workout-logs/plan/${planId}`);
          return { planId, data: r.data.data };
        })
      );
      results.forEach(result => {
        if (result.status === 'fulfilled' && result.value) {
          logs[String(result.value.planId)] = result.value.data;
        }
      });
      if (!cancelled) setPlanLogs(logs);
    };

    const load = async () => {
      setLoading(true);
      try {
        const profileRes = await api.get('/users/profile');
        if (cancelled) return;

        const prof = profileRes.data.data;
        setProfile(prof);
        const saved = (prof?.savedWorkoutPlans || []).filter(Boolean);
        setSavedPlans(saved);

        try {
          const rankingRes = await api.get('/workout-logs/weekly-ranking');
          if (!cancelled) {
            applyRankingData(rankingRes.data.data);
          }
        } catch (rankErr) {
          console.error('Weekly ranking unavailable:', rankErr);
          if (!cancelled) {
            applyRankingData(null);
          }
        }

        await loadPlanLogs(saved);
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          setSavedPlans([]);
          setPlanLogs({});
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [location.key]);

  const refreshRanking = async () => {
    try {
      const { data } = await api.get('/workout-logs/weekly-ranking');
      applyRankingData(data.data);
    } catch (e) {
      console.error(e);
    }
  };

  const getLogForDay = (planId, dayNumber) =>
    (planLogs[String(planId)] || []).find(l => Number(l.dayNumber) === Number(dayNumber));

  const applyLogResponse = (planId, log) => {
    setPlanLogs(prev => upsertPlanLog(prev, planId, log));
  };

  const logPlanDay = async (plan, dayNumber) => {
    const id = planIdOf(plan);
    const existing = getLogForDay(id, dayNumber);

    if (existing) {
      setLogLoading(`${id}-${dayNumber}`);
      try {
        await api.delete(`/workout-logs/plan/${id}/day/${dayNumber}`);
        setPlanLogs(prev => removePlanLog(prev, id, dayNumber));
        await refreshRanking();
        showToast(t('day_unlogged'));
      } catch (e) {
        showToast(e.response?.data?.message || (lang === 'vi' ? 'Không thể gỡ buổi tập.' : 'Could not unlog day.'));
      } finally {
        setLogLoading(null);
      }
      return;
    }

    if (!profile?.weight || !profile?.height) {
      showToast(t('dash_profile_required'));
      return;
    }

    setLogLoading(`${id}-${dayNumber}`);
    try {
      const { data } = await api.post('/workout-logs', { workoutPlanId: id, dayNumber });
      const log = data.data;
      applyLogResponse(id, log);
      await refreshRanking();
      showToast(`${t('day_logged')} · ${log.caloriesBurned} ${t('kcal_unit')}`);
    } catch (e) {
      const existingLog = e.response?.data?.data;
      if (existingLog?.caloriesBurned > 0) {
        applyLogResponse(id, existingLog);
        await refreshRanking();
        showToast(`${t('day_logged')} · ${existingLog.caloriesBurned} ${t('kcal_unit')}`);
      } else {
        showToast(e.response?.data?.message || (lang === 'vi' ? 'Không thể ghi nhận.' : 'Could not log day.'));
      }
    } finally {
      setLogLoading(null);
    }
  };

  if (loading) {
    return (
      <main className="container dash-loading">
        <div className="spinner" style={{ width: 32, height: 32, borderColor: 'var(--rose-soft)', borderTopColor: 'var(--rose)' }} />
      </main>
    );
  }

  return (
    <main className="container dash-page">
      <div className="page-head">
        <h1>{t('nav_dashboard')}</h1>
        <p>{t('dashp_desc')}</p>
      </div>

      <section className="card dash-leaderboard">
        <div className="dash-leaderboard-head">
          <div>
            <h3>{t('weekly_ranking')}</h3>
            <p className="dash-leaderboard-desc">{t('weekly_ranking_desc')}</p>
          </div>
          <div className="dash-my-stats">
            <div className="dash-stat-box">
              <span className="dash-stat-val">{myWeekTotal}</span>
              <span className="dash-stat-label">{t('total_kcal_week')}</span>
            </div>
            <div className="dash-stat-box">
              <span className="dash-stat-val">{myRank ?? '—'}</span>
              <span className="dash-stat-label">
                {t('rank_out_of_users', { count: totalParticipants })}
              </span>
            </div>
          </div>
        </div>

        {ranking.length === 0 ? (
          <p className="dash-rank-empty">{t('weekly_ranking_empty')}</p>
        ) : (
          <ol className="dash-rank-list">
            {ranking.map(row => (
              <li
                key={row.userId}
                className={`dash-rank-row${row.isCurrentUser ? ' is-me' : ''}${row.rank <= 3 ? ` top-${row.rank}` : ''}`}
              >
                <span className="dash-rank-pos">{row.rank}</span>
                <span className="dash-rank-avatar" aria-hidden="true">
                  {row.profileImage
                    ? <img src={row.profileImage} alt="" />
                    : initialsFromName(row.name)}
                </span>
                <span className="dash-rank-name">
                  {row.name}{row.isCurrentUser ? ` (${t('you_label')})` : ''}
                </span>
                <span className="dash-rank-stat">
                  <strong>{row.totalCalories}</strong> {t('kcal_unit')}
                  <span className="dash-rank-sessions"> · {row.sessions} {t('sessions_word')}</span>
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="card dash-saved-plans">
        <div className="details-head">
          <h3>{t('saved_plans')}</h3>
          <div className="details-head-actions">
            <Link to="/generate-plan" className="btn btn-ghost btn-sm">{t('create_first_plan')}</Link>
          </div>
        </div>

        {savedPlans.length === 0 ? (
          <p className="dash-plans-empty">{t('no_plans')}</p>
        ) : (
          <div className="dash-plans-grid">
            {savedPlans.map(plan => {
              const id = planIdOf(plan);
              const weekLabel = `${plan.durationWeeks} ${lang === 'vi' ? 'tuần' : plan.durationWeeks === 1 ? 'week' : 'weeks'}`;
              const daysPerWeek = plan.daysPerWeek || 4;
              const thumbSchedule = lang === 'vi'
                ? `${weekLabel} - ${daysPerWeek} ngày/tuần`
                : `${weekLabel} - ${daysPerWeek} days per week`;
              const weeks = groupDaysByWeek(plan.days);

              return (
                <article key={id} className="dash-plan-card">
                  <div className="fav-thumb-wrap">
                    <button
                      type="button"
                      className="fav-thumb-link saved-plan-open"
                      onClick={() => setPreviewPlanId(id)}
                    >
                      <div className="fav-thumb saved-plan-thumb">
                        <div className="saved-plan-thumb-glow" aria-hidden="true" />
                        <div className="saved-plan-thumb-inner">
                          <span className="saved-plan-thumb-label">{goalLabel(plan.goal)}</span>
                          <span className="saved-plan-thumb-days">{thumbSchedule}</span>
                        </div>
                      </div>
                    </button>
                    <span className="fav-diff-badge saved-plan-badge">{t('ai_badge')}</span>
                  </div>

                  {plan.targetBodyParts?.length > 0 && (
                    <div className="dash-plan-tags">
                      {plan.targetBodyParts.map((a, i) => (
                        <span key={a} className={`tag ${i === 0 ? 'tag-rose' : 'tag-char'}`}>{areaLabel(a)}</span>
                      ))}
                    </div>
                  )}

                  <div className="dash-plan-weeks">
                    {weeks.map(({ week, days }) => (
                      <div key={week} className="dash-week-block">
                        <h4 className="dash-week-title">{t('week_word')} {week}</h4>
                        <div className="dash-day-chips">
                          {days.map(day => {
                            const log = getLogForDay(id, day.dayNumber);
                            const done = !!log;
                            const loadingKey = `${id}-${day.dayNumber}`;
                            const isLoading = logLoading === loadingKey;

                            return (
                              <button
                                key={day.dayNumber}
                                type="button"
                                className={`dash-day-chip${done ? ' done' : ''}`}
                                onClick={() => logPlanDay(plan, day.dayNumber)}
                                disabled={isLoading}
                                title={done ? t('tap_to_unlog') : (day.focus || undefined)}
                              >
                                {isLoading ? (
                                  <span className="spinner dash-day-spinner" />
                                ) : (
                                  <>
                                    <span className="dash-day-chip-label">{t('day_word')} {day.dayNumber}</span>
                                    {done && log.caloriesBurned > 0 && (
                                      <span className="dash-day-chip-kcal">{log.caloriesBurned} {t('kcal_unit')}</span>
                                    )}
                                    {done && (
                                      <svg className="dash-day-check" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
                                        <polyline points="20 6 9 17 4 12"/>
                                      </svg>
                                    )}
                                  </>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {toast && <div className="toast">{toast}</div>}

      {previewPlanId && (
        <PlanPreviewModal
          planId={previewPlanId}
          onClose={() => setPreviewPlanId(null)}
        />
      )}
    </main>
  );
}
