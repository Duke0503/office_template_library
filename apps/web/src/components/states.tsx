import { AlertCircleIcon, SearchXIcon } from 'lucide-react';
import { Link } from 'react-router';
import { Alert, AlertAction, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';

/** Error state with retry (CAP-9). Never a blank screen. */
export function ErrorState({ title, error, onRetry }: { title: string; error: unknown; onRetry?: () => void }) {
  const detail = error instanceof Error ? error.message : 'The server could not complete the request.';
  return (
    <Alert variant="destructive" role="alert">
      <AlertCircleIcon />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{detail} Check that the server is running, then try again.</AlertDescription>
      {onRetry && (
        <AlertAction>
          <Button size="sm" variant="outline" onClick={onRetry}>
            Retry
          </Button>
        </AlertAction>
      )}
    </Alert>
  );
}

export function NotFoundState({ title, description, linkTo, linkLabel }: { title: string; description: string; linkTo: string; linkLabel: string }) {
  return (
    <Empty className="my-12">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <SearchXIcon />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button asChild>
          <Link to={linkTo}>{linkLabel}</Link>
        </Button>
      </EmptyContent>
    </Empty>
  );
}
