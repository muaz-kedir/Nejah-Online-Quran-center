import { Link, useLocation } from '@tanstack/react-router';
import { ChevronRight, Home } from 'lucide-react';

export function Breadcrumbs() {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  const formatBreadcrumb = (str: string) => {
    return str
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <nav className="flex items-center space-x-2 text-sm mb-6">
      <Link
        to="/dashboard"
        className="flex items-center text-gray-500 hover:text-emerald-600 transition-colors"
      >
        <Home className="h-4 w-4" />
      </Link>

      {pathnames.map((name, index) => {
        const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
        const isLast = index === pathnames.length - 1;

        return (
          <div key={name} className="flex items-center">
            <ChevronRight className="h-4 w-4 text-gray-400 mx-2" />
            {isLast ? (
              <span className="text-gray-900 font-medium">{formatBreadcrumb(name)}</span>
            ) : (
              <Link
                to={routeTo}
                className="text-gray-500 hover:text-emerald-600 transition-colors"
              >
                {formatBreadcrumb(name)}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
