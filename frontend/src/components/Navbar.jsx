import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import i18n from '../i18n';

export default function Navbar() {
  const { t, i18n: i18nInst } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const toggleLang = (lang) => {
    i18nInst.changeLanguage(lang);
    localStorage.setItem('glowher_lang', lang);
  };

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <nav className="navbar">
      <div className="nav-inner">
        <NavLink to="/" className="nav-logo">
          <span className="nav-wordmark"><span className="wm-glow">Glow</span><span className="wm-her">Her</span></span>
        </NavLink>

        <div className="nav-links">
          <NavLink to="/" end className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>{t('nav_home')}</NavLink>
          <NavLink to="/exercises" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>{t('nav_exercises')}</NavLink>
          <NavLink to="/generate-plan" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>{t('nav_plans')}</NavLink>
          <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>{t('nav_dashboard')}</NavLink>
        </div>

        <div className="nav-right">
          <div className="lang-toggle">
            <button onClick={() => toggleLang('en')} className={i18nInst.language === 'en' ? 'lang-btn active' : 'lang-btn'}>EN</button>
            <span className="lang-sep">|</span>
            <button onClick={() => toggleLang('vi')} className={i18nInst.language === 'vi' ? 'lang-btn active' : 'lang-btn'}>VI</button>
          </div>
          {user ? (
            <div className="nav-user-menu">
              <NavLink to="/profile" className="nav-avatar" title={user.name}>
                {initials}
              </NavLink>
              <div className="nav-user-dropdown">
                <button type="button" className="nav-user-dropdown-item" onClick={handleLogout}>
                  {t('log_out')}
                </button>
              </div>
            </div>
          ) : (
            <NavLink to="/login" className="btn btn-primary btn-sm">{t('nav_login')}</NavLink>
          )}
        </div>
      </div>
    </nav>
  );
}
