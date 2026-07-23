import { memo } from 'react';
import { Link, useLocation } from '@tanstack/react-router';
import { ChevronRight, Home } from 'lucide-react';

export const Breadcrumbs = memo(function Breadcrumbs() {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  const formatBreadcrumb = (str: string) => {
    return str
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <nav className="mb-6 flex items-center space-x-2 text-sm">
      <Link
        to="/dashboard"
        className="flex items-center text-muted-foreground transition-colors hover:text-nejah-electric"
      >
        <Home className="h-4 w-4" />
      </Link>

      {pathnames.map((name, index) => {
        const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
        const isLast = index === pathnames.length - 1;

        return (
          <div key={name} className="flex items-center">
            <ChevronRight className="mx-2 h-4 w-4 text-muted-foreground/50" />
            {isLast ? (
              <span className="font-medium text-foreground">{formatBreadcrumb(name)}</span>
            ) : (
              <Link
                to={routeTo}
                className="text-muted-foreground transition-colors hover:text-nejah-electric"
              >
                {formatBreadcrumb(name)}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
});
