import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import SplashPage from './pages/SplashPage';
import GeneratePage from './pages/GeneratePage';
import ProgressPage from './pages/ProgressPage';
import GalleryPage from './pages/GalleryPage';
import ProfilePage from './pages/ProfilePage';
import HomePage from './pages/HomePage';
import ShopPage from './pages/ShopPage';
import { AppLayout } from './components/AppLayout';
import { AuthGuard } from './components/AuthGuard';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Splash — точка входа, авторизация */}
        <Route path="/" element={<SplashPage />} />

        {/* Прогресс генерации — без таб-бара */}
        <Route
          path="/generate/progress"
          element={
            <AuthGuard>
              <div className="app-shell app-shell--no-tabs">
                <ProgressPage />
              </div>
            </AuthGuard>
          }
        />

        {/* Основные страницы — с BottomBar (таб-бар или submit-кнопка) */}
        <Route
          element={
            <AuthGuard>
              <AppLayout />
            </AuthGuard>
          }
        >
          <Route path="/home" element={<HomePage />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/generate" element={<GeneratePage />} />
          <Route path="/gallery" element={<GalleryPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
