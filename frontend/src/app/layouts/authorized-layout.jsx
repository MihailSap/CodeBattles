import { Outlet } from 'react-router-dom';
import Header from '@/widgets/app-header';

export const AuthorizedLayout = () => (
  <>
    <Header />
    <main className="main-content">
      <Outlet />
    </main>
  </>
);