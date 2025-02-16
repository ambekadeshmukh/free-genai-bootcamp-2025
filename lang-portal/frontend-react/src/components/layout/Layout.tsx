
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Breadcrumbs from './Breadcrumbs';

export default function Layout() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Breadcrumbs />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="page-transition">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
