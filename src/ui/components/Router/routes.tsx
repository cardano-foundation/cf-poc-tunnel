import React, {lazy, ReactNode, Suspense} from 'react';
import { Navigate, RouteObject, useRoutes } from 'react-router-dom';
import { useAuth } from '@components/Router/AuthProvider';

const SessionList = lazy(() => import('@pages/popup/sessionList/SessionList'));
const SessionDetails = lazy(
  () => import('@pages/popup/sessionDetails/SessionDetails'),
);
const Connect = lazy(() => import('@pages/popup/connect/Connect'));
const Lock = lazy(() => import('@pages/popup/lock/Lock'));

type ProtectedRouteProps = {
  children: ReactNode;
};

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isLoggedIn } = useAuth();

  if (!isLoggedIn) {
    return <Navigate to="/lock" replace />;
  }

  return <>{children}</> || null;
};

export const routes: Array<RouteObject> = [
  {
    index: true,
    element: (
      <ProtectedRoute>
        <SessionList />
      </ProtectedRoute>
    ),
  },
  {
    path: '/:id',
    element: (
      <ProtectedRoute>
        <SessionDetails />
      </ProtectedRoute>
    ),
  },
  {
    path: '/:id/connect',
    element: (
      <ProtectedRoute>
        <Connect />
      </ProtectedRoute>
    ),
  },
  {
    path: '/lock',
    element: <Lock />,
  },
  {
    path: '*',
    element: <div>Not Found</div>,
  },
];

export default function Routes() {
  return <Suspense fallback={null}>{useRoutes(routes)}</Suspense>;
}
