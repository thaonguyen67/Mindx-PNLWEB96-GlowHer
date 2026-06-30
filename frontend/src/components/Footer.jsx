import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <span className="footer-logo"><span className="wm-glow">Glow</span><span className="wm-her">Her</span></span>
          <p>{t('foot_tagline')}</p>
        </div>
        <div className="footer-links">
          <Link to="/">{t('foot_about')}</Link>
          <Link to="/">{t('foot_privacy')}</Link>
          <Link to="/">{t('foot_contact')}</Link>
        </div>
        <p className="footer-copy">{t('foot_copy')}</p>
      </div>
    </footer>
  );
}
