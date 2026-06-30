import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './NotFound.css';

export default function NotFound() {
  const { i18n } = useTranslation();
  const vi = i18n.language === 'vi';

  return (
    <main className="nf-page container">
      <div className="nf-inner">
        <div className="nf-code">404</div>
        <h1>{vi ? 'Trang không tồn tại' : 'Page not found'}</h1>
        <p>
          {vi
            ? 'Trang bạn tìm kiếm đã bị xóa hoặc không tồn tại.'
            : "The page you're looking for doesn't exist or has been moved."}
        </p>
        <Link to="/" className="btn btn-primary">
          {vi ? 'Về trang chủ' : 'Back to Home'}
        </Link>
      </div>
    </main>
  );
}
