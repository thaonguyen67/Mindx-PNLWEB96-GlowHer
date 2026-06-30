import { useState, useEffect, useCallback, useId } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import ExerciseVideo from '../components/ExerciseVideo';
import ExerciseDetailModal from '../components/ExerciseDetailModal';
import HeartButton from '../components/HeartButton';
import './Exercises.css';

const BODY_PARTS   = ['legs','glutes','core','back','arms','chest','shoulders','full'];
const EQUIPMENTS   = ['bodyweight','dumbbells','barbell','kettlebell'];
const DIFFICULTIES = ['beginner','intermediate','advanced'];
const DIFF_COLOR   = { beginner:'#4F9D7E', intermediate:'#C2873F', advanced:'var(--rose-deep)' };

/* ── sub-components ────────────────────────────────────────────────── */
function Check({ checked, onChange, label }) {
  return (
    <label className={`filter-check${checked ? ' checked' : ''}`} onClick={onChange}>
      <span className="check-box">
        {checked && (
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        )}
      </span>
      {label}
    </label>
  );
}

function FilterGroup({ label, children, last, defaultOpen = true, activeCount = 0 }) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();

  return (
    <div className={`filter-group${last ? ' last' : ''}${open ? ' open' : ''}`}>
      <button
        type="button"
        className="filter-toggle"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-controls={panelId}
      >
        <span className="filter-label">{label}</span>
        <span className="filter-toggle-right">
          {activeCount > 0 && <span className="filter-count">{activeCount}</span>}
          <svg
            className={`filter-chev${open ? ' open' : ''}`}
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            aria-hidden="true"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>
      </button>
      <div id={panelId} className="filter-panel" hidden={!open}>
        <div className="filter-options">{children}</div>
      </div>
    </div>
  );
}

/* ── main page ─────────────────────────────────────────────────────── */
export default function Exercises() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const [exercises, setExercises]   = useState([]);
  const [total, setTotal]           = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage]             = useState(1);
  const [search, setSearch]         = useState('');
  const [dbSearch, setDbSearch]     = useState('');
  const [bodyParts, setBodyParts]   = useState([]);
  const [equipments, setEquipments] = useState([]);
  const [difficulties, setDiff]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [selected, setSelected]     = useState(null);
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const [favToast, setFavToast]     = useState('');

  useEffect(() => {
    if (!user) return;
    api.get('/users/profile')
      .then(({ data }) => {
        const favs = data.data?.favoriteExercises || [];
        setFavoriteIds(new Set(favs.map(f => (f._id || f).toString())));
      })
      .catch(console.error);
  }, [user]);

  const showFavToast = (msg) => {
    setFavToast(msg);
    setTimeout(() => setFavToast(''), 2500);
  };

  const syncFavorites = (user) => {
    const favs = user?.favoriteExercises || [];
    setFavoriteIds(new Set(favs.map(f => (f._id || f).toString())));
    updateUser(user);
  };

  const toggleFavorite = async (e, ex) => {
    e.stopPropagation();
    if (!user) {
      navigate('/login', { state: { from: '/exercises' } });
      return;
    }
    const id = ex._id.toString();
    const wasFav = favoriteIds.has(id);

    setFavoriteIds(prev => {
      const next = new Set(prev);
      if (wasFav) next.delete(id); else next.add(id);
      return next;
    });

    try {
      const { data } = await api.post('/users/favorites/toggle', { exerciseId: id });
      syncFavorites(data.data.user);
      showFavToast(t(data.data.favorited ? 'favorite_added' : 'favorite_removed'));
    } catch {
      setFavoriteIds(prev => {
        const next = new Set(prev);
        if (wasFav) next.add(id); else next.delete(id);
        return next;
      });
    }
  };

  const isFavorited = (ex) => favoriteIds.has(ex._id.toString());

  useEffect(() => {
    const id = setTimeout(() => { setDbSearch(search); setPage(1); }, 300);
    return () => clearTimeout(id);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ page, limit: 9 });
      if (dbSearch) p.set('search', dbSearch);
      bodyParts.forEach(bp => p.append('bodyPart', bp));
      equipments.forEach(eq => p.append('equipment', eq));
      difficulties.forEach(d => p.append('difficulty', d));
      const { data } = await api.get(`/exercises?${p}`);
      setExercises(data.data.items);
      setTotal(data.data.totalItems);
      setTotalPages(data.data.totalPages);
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  }, [page, dbSearch, bodyParts, equipments, difficulties]);

  useEffect(() => { load(); }, [load]);

  const toggle = (arr, setArr, val) => {
    setPage(1);
    setArr(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]);
  };

  const clearAll = () => { setBodyParts([]); setEquipments([]); setDiff([]); setSearch(''); setPage(1); };
  const hasFilters = bodyParts.length || equipments.length || difficulties.length || search;

  const exName = (ex) => lang === 'vi' && ex.nameVi ? ex.nameVi : ex.name;
  const exDesc = (ex) => lang === 'vi' && ex.descriptionVi ? ex.descriptionVi : ex.description;

  return (
    <main className="container lib-page">
      <div className="page-head">
        <h1>{t('lib_title')}</h1>
        <p>{t('libp_desc')}</p>
      </div>

      <div className="lib-layout">
        {/* sidebar */}
        <aside className="lib-sidebar card">
          <div className="sidebar-head">
            <span className="sidebar-title">{t('filters')}</span>
            {hasFilters && <button className="clear-btn" onClick={clearAll}>{t('clear_all')}</button>}
          </div>
          <FilterGroup label={t('muscle_group')} activeCount={bodyParts.length}>
            {BODY_PARTS.map(bp => (
              <Check key={bp} checked={bodyParts.includes(bp)} onChange={() => toggle(bodyParts, setBodyParts, bp)} label={t('m_'+bp)} />
            ))}
          </FilterGroup>
          <FilterGroup label={t('equipment')} activeCount={equipments.length}>
            {EQUIPMENTS.map(eq => (
              <Check key={eq} checked={equipments.includes(eq)} onChange={() => toggle(equipments, setEquipments, eq)} label={t('e_'+eq)} />
            ))}
          </FilterGroup>
          <FilterGroup label={t('difficulty')} last activeCount={difficulties.length}>
            {DIFFICULTIES.map(d => (
              <Check key={d} checked={difficulties.includes(d)} onChange={() => toggle(difficulties, setDiff, d)} label={t('d_'+d)} />
            ))}
          </FilterGroup>
        </aside>

        {/* results */}
        <div className="lib-results">
          <div className="lib-topbar">
            <span className="lib-count">{t('showing')} <strong>{total}</strong> {t('exercises_word')}</span>
            <div className="search-wrap">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input type="search" placeholder={t('search_ph')} value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>

          {loading ? (
            <div className="lib-loading">
              <div className="spinner" style={{ width:28,height:28,borderColor:'var(--rose-soft)',borderTopColor:'var(--rose)' }} />
            </div>
          ) : exercises.length === 0 ? (
            <div className="lib-empty">
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="var(--char-faint)" strokeWidth="1.5">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <p>{t('no_results')}</p>
              <span>{t('no_results_sub')}</span>
            </div>
          ) : (
            <div className="ex-grid">
              {exercises.map(ex => (
                <div key={ex._id} className="ex-card card" onClick={() => setSelected(ex)}>
                  <div className="ex-thumb">
                    <ExerciseVideo src={ex.video} label={exName(ex)} />
                    <span className="diff-badge" style={{ color: DIFF_COLOR[ex.difficulty] }}>{t('d_'+ex.difficulty)}</span>
                    <HeartButton
                      favorited={isFavorited(ex)}
                      onToggle={(e) => toggleFavorite(e, ex)}
                      label={isFavorited(ex) ? t('favorite_remove') : t('favorite_add')}
                    />
                  </div>
                  <div className="ex-body">
                    <h3>{exName(ex)}</h3>
                    <p className="ex-desc">{exDesc(ex)}</p>
                    <div className="ex-tags">
                      <span className="tag tag-rose">{t('m_'+ex.bodyPart)}</span>
                      <span className="tag tag-char">{t('e_'+ex.equipment)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="pager">
              <button className="pager-btn" onClick={() => setPage(p => p-1)} disabled={page === 1}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
                {t('prev')}
              </button>
              {Array.from({ length: totalPages }, (_,i) => i+1).map(n => (
                <button key={n} className={`pager-num${n === page ? ' active' : ''}`} onClick={() => setPage(n)}>{n}</button>
              ))}
              <button className="pager-btn" onClick={() => setPage(p => p+1)} disabled={page === totalPages}>
                {t('next')}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </div>
          )}
        </div>
      </div>

      {selected && (
        <ExerciseDetailModal
          ex={selected}
          onClose={() => setSelected(null)}
          favorited={isFavorited(selected)}
          onToggleFavorite={(e) => toggleFavorite(e, selected)}
        />
      )}
      {favToast && <div className="toast">{favToast}</div>}
    </main>
  );
}
