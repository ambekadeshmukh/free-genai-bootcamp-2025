
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, BookOpen, Book, List, Clock, Settings } from 'lucide-react';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { to: '/study-activities', label: 'Study Activities', Icon: BookOpen },
  { to: '/words', label: 'Words', Icon: Book },
  { to: '/groups', label: 'Word Groups', Icon: List },
  { to: '/sessions', label: 'Sessions', Icon: Clock },
  { to: '/settings', label: 'Settings', Icon: Settings },
];

export default function Navbar() {
  const location = useLocation();

  return (
    <nav className="border-b bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link to="/dashboard" className="flex items-center space-x-2">
            <img src="/lovable-uploads/832044e6-d36b-437e-ac82-11660782a3d0.png" alt="Logo" className="h-8 w-auto" />
          </Link>
          
          <div className="flex space-x-4">
            {navItems.map(({ to, label, Icon }) => (
              <Link
                key={to}
                to={to}
                className={`nav-link flex items-center space-x-2 ${
                  location.pathname === to ? 'active' : ''
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
