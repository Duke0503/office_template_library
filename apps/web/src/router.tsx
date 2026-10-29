import { createBrowserRouter, Navigate } from 'react-router';
import { AppShell } from './components/app-shell';
import { DocumentsRoute } from './routes/documents';
import { GalleryRoute } from './routes/gallery';
import { NotFoundRoute } from './routes/not-found';

// Routes from EXPERIENCE.md Information Architecture.
export const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { index: true, element: <Navigate to="/templates/docx" replace /> },
      { path: 'templates/:kind', element: <GalleryRoute /> },
      { path: 'documents', element: <DocumentsRoute /> },
      // The editor pulls in the ONLYOFFICE wrapper; load it only when needed.
      { path: 'documents/:id/edit', lazy: () => import('./routes/editor').then((m) => ({ Component: m.EditorRoute })) },
      { path: '*', element: <NotFoundRoute /> },
    ],
  },
]);
