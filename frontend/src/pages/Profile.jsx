import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import ExerciseVideo from '../components/ExerciseVideo';
import PlanPreviewModal from '../components/PlanPreviewModal';
import ExerciseDetailModal from '../components/ExerciseDetailModal';
import './Profile.css';

const GOALS = [
  { val:'lose',     en:'Lose weight',    vi:'Giảm cân' },
  { val:'tone',     en:'Tone & sculpt',  vi:'Săn chắc cơ thể' },
  { val:'strength', en:'Build strength', vi:'Tăng sức mạnh' },
  { val:'glutes',   en:'Glutes & legs',  vi:'Mông & chân' },
  { val:'general',  en:'General fitness',vi:'Thể lực tổng quát' },
];
const DIFF_COLOR = { beginner:'#4F9D7E', intermediate:'#C2873F', advanced:'var(--rose-deep)' };

function CameraIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
      <circle cx="12" cy="13" r="4"/>
    </svg>
  );
}
function EditIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  );
}
function TrashIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
      <line x1="10" y1="11" x2="10" y2="17"/>
      <line x1="14" y1="11" x2="14" y2="17"/>
    </svg>
  );
}
function HeartIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
        fill="currentColor"
        stroke="none"
      />
    </svg>
  );
}
export default function Profile() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const { user, updateUser } = useAuth();

  const [profile, setProfile]       = useState(null);
  const [loading, setLoading]       = useState(true);
  const [editing, setEditing]       = useState(false);
  const [saving, setSaving]         = useState(false);
  const [uploading, setUploading]   = useState(false);
  const [preview, setPreview]       = useState(null);
  const [toast, setToast]           = useState('');
  const [toastErr, setToastErr]     = useState('');
  const [removingPlan, setRemovingPlan] = useState(null);
  const [removingFav, setRemovingFav]   = useState(null);
  const [previewPlanId, setPreviewPlanId] = useState(null);
  const [previewExercise, setPreviewExercise] = useState(null);

  const [form, setForm] = useState({ name:'', weight:'', height:'' });
  const [fieldErrors, setFieldErrors] = useState({ weight:'', height:'' });

  const fileRef = useRef(null);

  const showToast = (msg, err = false) => {
    if (err) { setToastErr(msg); setTimeout(() => setToastErr(''), 3500); }
    else     { setToast(msg);    setTimeout(() => setToast(''),    3500); }
  };

  const validateForm = () => {
    const errors = { weight:'', height:'' };

    if (!String(form.weight).trim()) {
      errors.weight = t('err_weight_required');
    } else {
      const w = Number(form.weight);
      if (Number.isNaN(w) || w < 30 || w > 200) errors.weight = t('err_weight_range');
    }

    if (!String(form.height).trim()) {
      errors.height = t('err_height_required');
    } else {
      const h = Number(form.height);
      if (Number.isNaN(h) || h < 100 || h > 250) errors.height = t('err_height_range');
    }

    return errors;
  };

  const clearFieldError = (field) => {
    setFieldErrors(prev => (prev[field] ? { ...prev, [field]: '' } : prev));
  };

  useEffect(() => {
    api.get('/users/profile')
      .then(p => {
        setProfile(p.data.data);
        const u = p.data.data;
        setForm({ name: u.name || '', weight: u.weight || '', height: u.height || '' });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
  };

  const handleUpload = async () => {
    const file = fileRef.current?.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('profileImage', file);
      const { data } = await api.post('/users/profile/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const updated = data.data;
      setProfile(updated);
      updateUser(updated);
      setPreview(null);
      if (fileRef.current) fileRef.current.value = '';
      showToast(lang === 'vi' ? 'Đã cập nhật ảnh đại diện.' : 'Photo updated.');
    } catch {
      showToast(lang === 'vi' ? 'Tải ảnh thất bại.' : 'Photo upload failed.', true);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e) => {
    e?.preventDefault?.();
    const errors = validateForm();
    setFieldErrors(errors);
    if (errors.weight || errors.height) {
      showToast(errors.weight || errors.height, true);
      return;
    }

    setSaving(true);
    try {
      const { data } = await api.put('/users/profile', {
        name:   form.name   || undefined,
        weight: Number(form.weight),
        height: Number(form.height),
      });
      const updated = data.data;
      setProfile(updated);
      updateUser(updated);
      setFieldErrors({ weight:'', height:'' });
      setEditing(false);
      showToast(t('profile_saved'));
    } catch (err) {
      showToast(err.response?.data?.message || t('profile_save_failed'), true);
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    setForm({ name: profile.name || '', weight: profile.weight || '', height: profile.height || '' });
    setFieldErrors({ weight:'', height:'' });
    setEditing(false);
  };

  const removeSavedPlan = async (planId) => {
    setRemovingPlan(planId);
    try {
      const { data } = await api.delete(`/users/saved-plans/${planId}`);
      const updated = data.data.user;
      setProfile(updated);
      updateUser(updated);
      showToast(t('plan_removed'));
    } catch (err) {
      showToast(err.response?.data?.message || t('profile_save_failed'), true);
    } finally {
      setRemovingPlan(null);
    }
  };

  const removeFavorite = async (exerciseId) => {
    setRemovingFav(exerciseId);
    try {
      const { data } = await api.post('/users/favorites/toggle', { exerciseId });
      const updated = data.data.user;
      setProfile(updated);
      updateUser(updated);
      showToast(t('favorite_removed'));
      return true;
    } catch (err) {
      showToast(err.response?.data?.message || t('profile_save_failed'), true);
      return false;
    } finally {
      setRemovingFav(null);
    }
  };

  const handleModalRemoveFavorite = async (e) => {
    e.stopPropagation();
    if (!previewExercise) return;
    const removed = await removeFavorite(previewExercise._id);
    if (removed) setPreviewExercise(null);
  };

  const avatarSrc = preview || profile?.profileImage || null;
  const initials  = (profile?.name || user?.name || 'U').split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();

  const goalLabel = (g) => {
    const found = GOALS.find(x => x.val === g);
    return found ? (lang === 'vi' ? found.vi : found.en) : g;
  };

  const areaLabel = (a) => t('m_' + a);

  const joinDate = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US', { year:'numeric', month:'long' })
    : '';

  if (loading) {
    return (
      <main className="container" style={{ display:'flex', justifyContent:'center', paddingTop:80 }}>
        <div className="spinner" style={{ width:32, height:32, borderColor:'var(--rose-soft)', borderTopColor:'var(--rose)' }} />
      </main>
    );
  }

  return (
    <main className="container profile-page">
      <div className="page-head">
        <h1>{t('profile_page_title')}</h1>
        <p>{t('profilep_desc')}</p>
      </div>

      <div className="profile-layout">
        {/* ── identity card ── */}
        <aside className="profile-identity card">
          {/* avatar */}
          <div className="avatar-wrap">
            <div className="avatar-circle">
              {avatarSrc
                ? <img src={avatarSrc} alt="avatar" className="avatar-img" />
                : <span className="avatar-initials">{initials}</span>
              }
            </div>
            <button
              className="avatar-upload-btn"
              onClick={() => fileRef.current?.click()}
              aria-label="upload photo"
            >
              <CameraIcon />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              style={{ display:'none' }}
              onChange={handleFileChange}
            />
          </div>

          {preview && (
            <div className="avatar-preview-bar">
              <span>{lang === 'vi' ? 'Ảnh mới' : 'New photo'}</span>
              <div className="avatar-preview-btns">
                <button className="btn btn-ghost btn-sm" onClick={() => { setPreview(null); if (fileRef.current) fileRef.current.value=''; }}>
                  {t('cancel')}
                </button>
                <button className="btn btn-primary btn-sm" disabled={uploading} onClick={handleUpload}>
                  {uploading
                    ? <div className="spinner" />
                    : (lang === 'vi' ? 'Lưu ảnh' : 'Save photo')
                  }
                </button>
              </div>
            </div>
          )}

          <div className="identity-meta">
            <h2 className="identity-name">{profile?.name || '—'}</h2>
            {joinDate && (
              <p className="identity-join">
                {t('member_since')} {joinDate}
              </p>
            )}
          </div>

          {/* stat row */}
          <div className="identity-stats">
            <div className="id-stat">
              <span className="id-stat-val">{profile?.favoriteExercises?.length ?? 0}</span>
              <span className="id-stat-label">{t('stat_favorites')}</span>
            </div>
            <div className="id-stat-sep" />
            <div className="id-stat">
              <span className="id-stat-val">{profile?.savedWorkoutPlans?.length ?? 0}</span>
              <span className="id-stat-label">{t('stat_plans')}</span>
            </div>
          </div>
        </aside>

        {/* ── account details ── */}
        <section className="profile-details card">
          <div className="details-head">
            <h3>{t('account')}</h3>
            {editing ? (
              <div className="details-head-actions">
                <button type="button" className="btn btn-ghost btn-sm" onClick={cancelEdit}>
                  {t('cancel')}
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  disabled={saving}
                  onClick={handleSave}
                >
                  {saving ? <div className="spinner" /> : t('save_changes')}
                </button>
              </div>
            ) : (
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => { setFieldErrors({ weight:'', height:'' }); setEditing(true); }}
              >
                <EditIcon />
                {lang === 'vi' ? 'Chỉnh sửa' : 'Edit'}
              </button>
            )}
          </div>

          <div className="details-view">
            <div className="detail-row">
              <span className="detail-row-label">{t('f_name')}</span>
              {editing ? (
                <span className="detail-row-control">
                  <input
                    type="text"
                    className="detail-row-input"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder={t('name_ph')}
                  />
                </span>
              ) : (
                <span className="detail-row-value">{profile?.name || '—'}</span>
              )}
            </div>

            <div className="detail-row">
              <span className="detail-row-label">{t('f_email')}</span>
              <span className="detail-row-value detail-row-value-muted">{profile?.email || '—'}</span>
            </div>

            <div className="detail-row">
              <span className="detail-row-label">{t('f_height')}</span>
              {editing ? (
                <span className="detail-row-control detail-row-control-inline">
                  <input
                    type="number"
                    min="100"
                    max="250"
                    className={`detail-row-input detail-row-input-num${fieldErrors.height ? ' field-invalid' : ''}`}
                    value={form.height}
                    onChange={e => { clearFieldError('height'); setForm(f => ({ ...f, height: e.target.value })); }}
                    placeholder={t('height_ph')}
                    aria-invalid={!!fieldErrors.height}
                  />
                  <span className="detail-row-unit">cm</span>
                </span>
              ) : (
                <span className="detail-row-value">
                  {profile?.height ? `${profile.height} cm` : '—'}
                </span>
              )}
            </div>

            <div className="detail-row">
              <span className="detail-row-label">{t('f_weight')}</span>
              {editing ? (
                <span className="detail-row-control detail-row-control-inline">
                  <input
                    type="number"
                    min="30"
                    max="200"
                    className={`detail-row-input detail-row-input-num${fieldErrors.weight ? ' field-invalid' : ''}`}
                    value={form.weight}
                    onChange={e => { clearFieldError('weight'); setForm(f => ({ ...f, weight: e.target.value })); }}
                    placeholder={t('weight_ph')}
                    aria-invalid={!!fieldErrors.weight}
                  />
                  <span className="detail-row-unit">kg</span>
                </span>
              ) : (
                <span className="detail-row-value">
                  {profile?.weight ? `${profile.weight} kg` : '—'}
                </span>
              )}
            </div>
          </div>
        </section>
      </div>

      <section className="profile-saved-plans card">
        <div className="details-head">
          <h3>{t('saved_plans')}</h3>
          <div className="details-head-actions">
            <Link to="/generate-plan" className="btn btn-ghost btn-sm">
              {t('create_first_plan')}
            </Link>
            {(profile?.savedWorkoutPlans?.length ?? 0) > 0 && (
              <Link to="/dashboard" className="btn btn-ghost btn-sm saved-plans-track-btn">
                {t('saved_plans_track')}
              </Link>
            )}
          </div>
        </div>
        {!profile?.savedWorkoutPlans?.length ? (
          <p className="fav-empty">{t('no_plans')}</p>
        ) : (
          <div className="fav-grid">
            {profile.savedWorkoutPlans.map(p => {
              const weekLabel = `${p.durationWeeks} ${lang === 'vi' ? 'tuần' : p.durationWeeks === 1 ? 'week' : 'weeks'}`;
              const daysPerWeek = p.daysPerWeek || 4;
              const thumbSchedule = lang === 'vi'
                ? `${weekLabel} - ${daysPerWeek} ngày/tuần`
                : `${weekLabel} - ${daysPerWeek} days per week`;
              return (
              <div key={p._id} className="fav-card saved-plan-card">
                <div className="fav-thumb-wrap">
                  <button
                    type="button"
                    className="fav-thumb-link saved-plan-open"
                    onClick={() => setPreviewPlanId(p._id)}
                  >
                    <div className="fav-thumb saved-plan-thumb">
                      <div className="saved-plan-thumb-glow" aria-hidden="true" />
                      <div className="saved-plan-thumb-inner">
                        <span className="saved-plan-thumb-label">{goalLabel(p.goal)}</span>
                        <span className="saved-plan-thumb-days">{thumbSchedule}</span>
                      </div>
                    </div>
                  </button>
                  <span className="fav-diff-badge saved-plan-badge">{t('ai_badge')}</span>
                  <button
                    type="button"
                    className="saved-plan-remove-btn"
                    onClick={() => removeSavedPlan(p._id)}
                    disabled={removingPlan === p._id}
                    aria-label={t('remove_saved_plan')}
                  >
                    {removingPlan === p._id
                      ? <span className="spinner" style={{ width:12, height:12, borderTopColor:'var(--rose)' }} />
                      : <TrashIcon />
                    }
                  </button>
                </div>
                <button
                  type="button"
                  className="fav-body saved-plan-open"
                  onClick={() => setPreviewPlanId(p._id)}
                >
                  {p.targetBodyParts?.length > 0 && (
                    <div className="saved-plan-areas">
                      {p.targetBodyParts.map((a, i) => (
                        <span key={a} className={`tag ${i === 0 ? 'tag-rose' : 'tag-char'}`}>{areaLabel(a)}</span>
                      ))}
                    </div>
                  )}
                </button>
              </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="profile-favorites card">
        <div className="details-head">
          <h3>{t('favorite_exercises')}</h3>
          <div className="details-head-actions">
            <Link to="/exercises" className="btn btn-ghost btn-sm">
              {t('explore_exercises')}
            </Link>
          </div>
        </div>
        {!profile?.favoriteExercises?.length ? (
          <p className="fav-empty">{t('no_favorites')}</p>
        ) : (
          <div className="fav-grid">
            {profile.favoriteExercises.map(ex => {
              const name = lang === 'vi' && ex.nameVi ? ex.nameVi : ex.name;
              return (
                <div key={ex._id} className="fav-card">
                  <div className="fav-thumb-wrap">
                    <button
                      type="button"
                      className="fav-thumb-link saved-plan-open"
                      onClick={() => setPreviewExercise(ex)}
                    >
                      <div className="fav-thumb">
                        <ExerciseVideo src={ex.video} label={name} />
                      </div>
                    </button>
                    {ex.difficulty && (
                      <span className="fav-diff-badge" style={{ color: DIFF_COLOR[ex.difficulty] }}>
                        {t('d_' + ex.difficulty)}
                      </span>
                    )}
                    <button
                      type="button"
                      className="fav-heart-btn"
                      onClick={() => removeFavorite(ex._id)}
                      disabled={removingFav === ex._id}
                      aria-label={t('favorite_remove')}
                      aria-pressed="true"
                    >
                      {removingFav === ex._id
                        ? <span className="spinner" style={{ width:12, height:12, borderTopColor:'var(--rose)' }} />
                        : <HeartIcon />
                      }
                    </button>
                  </div>
                  <button
                    type="button"
                    className="fav-body saved-plan-open"
                    onClick={() => setPreviewExercise(ex)}
                  >
                    <h4>{name}</h4>
                    <div className="ex-tags">
                      <span className="tag tag-rose">{t('m_' + ex.bodyPart)}</span>
                      <span className="tag tag-char">{t('e_' + ex.equipment)}</span>
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {toast    && <div className="toast">{toast}</div>}
      {toastErr && <div className="toast toast-err">{toastErr}</div>}

      {previewPlanId && (
        <PlanPreviewModal
          planId={previewPlanId}
          onClose={() => setPreviewPlanId(null)}
        />
      )}

      {previewExercise && (
        <ExerciseDetailModal
          ex={previewExercise}
          onClose={() => setPreviewExercise(null)}
          favorited
          onToggleFavorite={handleModalRemoveFavorite}
        />
      )}
    </main>
  );
}
