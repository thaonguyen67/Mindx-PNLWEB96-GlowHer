import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import './Home.css';

function DumbbellIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6.5 6.5h11M6.5 17.5h11M3 9.5v5M21 9.5v5M3 11.5h18"/>
    </svg>
  );
}
function ZapIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  );
}
function ChartIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
    </svg>
  );
}

export default function Home() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const { user } = useAuth();

  const features = [
    {
      icon: <DumbbellIcon />,
      title: t('lib_title'),
      body: t('lib_card_desc'),
      cta: lang === 'vi' ? 'Khám phá' : 'Browse library',
      to: '/exercises',
    },
    {
      icon: <ZapIcon />,
      title: t('plan_title'),
      body: t('plan_card_desc'),
      cta: t('plan_card_cta'),
      to: '/generate-plan',
    },
    {
      icon: <ChartIcon />,
      title: t('track_title'),
      body: t('track_card_desc'),
      cta: t('track_cta'),
      to: '/dashboard',
    },
  ];

  return (
    <main className="container home-page">
      {/* ── hero ── */}
      <section className="home-hero">
        <div className="hero-left page-head home-hero-head">
          <p className="eyebrow">
            {lang === 'vi' ? 'Tập sức mạnh dành cho phụ nữ' : 'Strength training for women'}
          </p>
          <h1 className="hero-h1">
            {t('hero_title_a')}{' '}
            <em>{t('hero_title_em')}</em>
          </h1>
          <p>{t('hero_sub')}</p>
          <div className="hero-ctas">
            {user ? (
              <>
                <Link to="/generate-plan" className="btn btn-primary btn-lg">
                  {t('cta_btn')}
                </Link>
                <Link to="/exercises" className="btn btn-ghost btn-lg">
                  {lang === 'vi' ? 'Xem bài tập' : 'Browse exercises'}
                </Link>
              </>
            ) : (
              <>
                <Link to="/register" className="btn btn-primary btn-lg">
                  {t('cta_btn')}
                </Link>
                <Link to="/exercises" className="btn btn-ghost btn-lg">
                  {lang === 'vi' ? 'Xem bài tập' : 'Browse exercises'}
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="hero-visual">
          <img
            src="/images/hero.jpg"
            alt={lang === 'vi' ? 'Phụ nữ tập luyện sức mạnh' : 'Woman strength training'}
            className="hero-photo"
          />
          <div className="float-card bl">
            <div className="float-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--rose-deep)" strokeWidth="2.2">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
                <polyline points="17 6 23 6 23 12"/>
              </svg>
            </div>
            <div>
              <div className="float-val">+27%</div>
              <div className="float-sub">{lang === 'vi' ? 'sức mạnh sau 6 tuần' : 'strength in 6 weeks'}</div>
            </div>
          </div>
          <div className="float-card tr">
            <div className="float-val-sm">15 min</div>
            <div className="float-sub-sm">{lang === 'vi' ? 'buổi hôm nay' : "today's session"}</div>
          </div>
        </div>
      </section>

      {/* ── features ── */}
      <section className="home-features">
        <p className="eyebrow" style={{ marginBottom:18 }}>
          {lang === 'vi' ? 'Mọi thứ bạn cần' : 'Everything you need'}
        </p>
        <div className="features-grid">
          {features.map(f => (
            <div key={f.title} className="feature-card card">
              <div className="feature-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.body}</p>
              <Link to={f.to} className="feature-link">{f.cta}</Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA band ── */}
      <section className="home-cta">
        <div className="cta-band">
          <div className="cta-band-glow cta-band-glow--tr" />
          <div className="cta-band-glow cta-band-glow--bl" />
          <div className="cta-band-inner">
            <div className="cta-band-copy">
              <p className="cta-band-eyebrow">
                {lang === 'vi' ? 'Huấn luyện viên AI' : 'AI coaching'}
              </p>
              <h2>{lang === 'vi' ? 'Sẵn sàng bắt đầu hành trình?' : 'Ready to start your journey?'}</h2>
              <p>
                {lang === 'vi'
                  ? 'AI coach của bạn đang chờ. Tạo kế hoạch cá nhân hóa ngay hôm nay.'
                  : 'Your AI coach is waiting. Build your personalized plan today.'}
              </p>
            </div>
            <div className="cta-band-action">
              <Link to={user ? '/generate-plan' : '/register'} className="cta-band-btn">
                <span>{t('cta_btn')}</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
