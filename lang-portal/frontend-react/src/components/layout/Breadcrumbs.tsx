
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export default function Breadcrumbs() {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  return (
    <div className="max-w-7xl mx-auto px-4 py-4">
      <nav className="breadcrumb">
        <Link to="/" className="text-primary hover:text-primary/80">
          Home
        </Link>
        {pathnames.map((value, index) => {
          const to = `/${pathnames.slice(0, index + 1).join('/')}`;
          const isLast = index === pathnames.length - 1;
          const label = value.split('-').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
          ).join(' ');

          return (
            <span key={to} className="flex items-center">
              <ChevronRight className="h-4 w-4 mx-2 text-muted-foreground/50" />
              {isLast ? (
                <span className="font-medium text-foreground">{label}</span>
              ) : (
                <Link to={to} className="text-primary hover:text-primary/80">
                  {label}
                </Link>
              )}
            </span>
          );
        })}
      </nav>
    </div>
  );
}
