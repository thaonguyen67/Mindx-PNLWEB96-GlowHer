import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import ExerciseVideo from './ExerciseVideo';
import '../pages/Exercises.css';

const DIFF_COLOR = { beginner: '#4F9D7E', intermediate: '#C2873F', advanced: 'var(--rose-deep)' };

function HeartButton({ favorited, onToggle, label }) {
  return (
    <button
      type="button"
      className={`heart-btn${favorited ? ' favorited' : ''}`}
      onClick={onToggle}
      aria-label={label}
      aria-pressed={favorited}
    >
      <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
          fill={favorited ? 'currentColor' : 'none'}
          stroke={favorited ? 'none' : 'currentColor'}
          strokeWidth={favorited ? 0 : 2}
        />
      </svg>
    </button>
  );
}

export default function ExerciseDetailModal({
  ex,
  onClose,
  favorited = false,
  onToggleFavorite,
  showFavorite = true,
}) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  if (!ex) return null;

  const name = lang === 'vi' && ex.nameVi ? ex.nameVi : ex.name;
  const desc = lang === 'vi' && ex.descriptionVi ? ex.descriptionVi : ex.description;
  const benefits = lang === 'vi' && ex.benefitsVi?.length ? ex.benefitsVi : ex.benefits;

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div
        className="modal-box"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="exercise-modal-title"
      >
        <button type="button" className="modal-close" onClick={onClose} aria-label={t('close')}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
        <div className="modal-grid">
          <div className="modal-media">
            <ExerciseVideo src={ex.video} label={name} controls />
            {ex.difficulty && (
              <span className="diff-badge" style={{ color: DIFF_COLOR[ex.difficulty] }}>
                {t('d_' + ex.difficulty)}
              </span>
            )}
            {showFavorite && onToggleFavorite && (
              <HeartButton
                favorited={favorited}
                onToggle={onToggleFavorite}
                label={favorited ? t('favorite_remove') : t('favorite_add')}
              />
            )}
          </div>
          <div className="modal-body">
            <h2 id="exercise-modal-title">{name}</h2>
            <div className="modal-tags">
              <span className="tag tag-rose">{t('m_' + ex.bodyPart)}</span>
              <span className="tag tag-char">{t('e_' + ex.equipment)}</span>
              {ex.difficulty && (
                <span className="tag" style={{ background: 'var(--ww2)', color: DIFF_COLOR[ex.difficulty] }}>
                  {t('d_' + ex.difficulty)}
                </span>
              )}
            </div>
            <p className="modal-section-label">{t('how_to')}</p>
            <p className="modal-desc">{desc}</p>
            <p className="modal-section-label">{t('benefits_label')}</p>
            <ul className="modal-benefits">
              {(benefits || []).map((b, i) => (
                <li key={i}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--rose)" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  {b}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
