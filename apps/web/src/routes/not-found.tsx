import { NotFoundState } from '@/components/states';

export function NotFoundRoute() {
  return <NotFoundState title="Page not found" description="The page you asked for does not exist." linkTo="/" linkLabel="Go to templates" />;
}
