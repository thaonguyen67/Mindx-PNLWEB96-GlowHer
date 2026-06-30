import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

export default function Login() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const registered = location.state?.registered;

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.email || !form.password) { setError('Please fill in all fields.'); return; }
    setLoading(true);
    try {
      await login(form.email, form.password);
      const returnTo = location.state?.from
        || (sessionStorage.getItem('glowher_draft_plan') ? '/generate-plan' : '/profile');
      navigate(returnTo, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-art">
        <div className="auth-art-logo"><span className="wm-glow">Glow</span><span className="wm-her">Her</span></div>
        <div className="auth-art-glow" />
        <div className="auth-art-body">
          <h2>{t('art_title_a')} <em>{t('art_title_em')}</em></h2>
          <p>{t('art_sub')}</p>
        </div>
      </div>

      <div className="auth-form-wrap">
        <div className="auth-form">
          <div className="auth-tabs">
            <button className="auth-tab active">{t('a_login')}</button>
            <Link to="/register" state={{ from: location.state?.from }} className="auth-tab">{t('a_signup')}</Link>
          </div>

          <h2>{t('welcome_back')}</h2>
          <p className="auth-lead">{t('login_lead')}</p>

          {registered && <div className="auth-success">Account created! Please log in.</div>}
          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={submit} noValidate>
            <div className="auth-field">
              <label>{t('f_email')}</label>
              <div className="input-wrap">
                <svg className="input-icon" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 7 10-7"/></svg>
                <input type="email" placeholder={t('email_ph')} value={form.email} onChange={e => set('email', e.target.value)} autoComplete="email" />
              </div>
            </div>

            <div className="auth-field">
              <label>{t('f_password')}</label>
              <div className="input-wrap">
                <svg className="input-icon" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                <input type={showPw ? 'text' : 'password'} placeholder={t('password_ph')} value={form.password} onChange={e => set('password', e.target.value)} autoComplete="current-password" />
                <button type="button" className="pw-toggle" onClick={() => setShowPw(v => !v)} tabIndex={-1}>
                  {showPw
                    ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>
            </div>

            <div className="auth-row">
              <label className="auth-check"><input type="checkbox" />{t('remember')}</label>
              <a href="#" className="auth-forgot">{t('forgot')}</a>
            </div>

            <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
              {loading ? <><span className="spinner" />{t('a_login')}…</> : t('a_login')}
            </button>
          </form>

          <p className="auth-switch">{t('new_here')} <Link to="/register" state={{ from: location.state?.from }}>{t('a_signup')}</Link></p>
        </div>
      </div>
    </div>
  );
}
