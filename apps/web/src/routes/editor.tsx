import { DocumentEditor } from '@onlyoffice/document-editor-react';
import { kindOf } from '@otl/shared';
import { ArrowLeftIcon, CheckIcon, DownloadIcon, InfoIcon } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { isNotFound } from '@/api/client';
import { useDocument, useEditorConfig } from '@/api/hooks';
import { ErrorState, NotFoundState } from '@/components/states';
import { Alert, AlertAction, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

/** Editor (CAP-5): ONLYOFFICE full-height under the product's own header. */
export function EditorRoute() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const document = useDocument(id);
  const editor = useEditorConfig(id);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [ready, setReady] = useState(false);

  if (isNotFound(document.error)) {
    return <NotFoundState title="Document not found" description="It may have been created in another installation of the app." linkTo="/documents" linkLabel="Go to My documents" />;
  }

  // Leaving the editor closes the session; Document Server then sends the save callback (AD-6).
  const done = () => navigate('/documents', { state: { editorClosedAt: Date.now() } });
  const retry = () => {
    setLoadError(null);
    setReady(false);
    setAttempt((n) => n + 1);
    void editor.refetch();
  };

  const d = document.data;

  return (
    <div className="flex h-[calc(100svh-3.5rem)] flex-col">
      <div className="flex h-14 shrink-0 items-center gap-3 border-b px-3 md:px-6">
        <Button asChild variant="ghost" size="icon" aria-label="Back to My documents">
          <Link to="/documents" state={{ editorClosedAt: Date.now() }}>
            <ArrowLeftIcon />
          </Link>
        </Button>
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {d ? <h1 className="truncate font-semibold">{d.title}</h1> : <Skeleton className="h-5 w-40" />}
          {d && (
            <Badge variant="secondary" className="shrink-0" data-testid="version-badge">
              {kindOf(d.kind).label} · v{d.version}
            </Badge>
          )}
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="hidden items-center gap-1.5 text-sm text-muted-foreground lg:flex">
              <InfoIcon className="size-4" aria-hidden />
              Changes are saved when you close the editor.
            </span>
          </TooltipTrigger>
          <TooltipContent>Document Server stores your changes a few seconds after the editor closes.</TooltipContent>
        </Tooltip>
        {d && (
          <Button asChild variant="outline" size="sm">
            <a href={d.downloadUrl} download>
              <DownloadIcon data-icon="inline-start" />
              <span className="hidden sm:inline">Download</span>
            </a>
          </Button>
        )}
        <Button size="sm" onClick={done}>
          <CheckIcon data-icon="inline-start" />
          Done
        </Button>
      </div>

      <div className="relative flex min-h-0 flex-1 flex-col">
        {editor.isError || loadError ? (
          <div className="mx-auto w-full max-w-2xl p-6">
            {editor.isError && !loadError ? (
              <ErrorState title="Couldn't open the document." error={editor.error} onRetry={retry} />
            ) : (
              <Alert variant="destructive" role="alert">
                <InfoIcon />
                <AlertTitle>The editor is unavailable.</AlertTitle>
                <AlertDescription>
                  Document Server may still be starting; this takes about a minute after <code>docker compose up</code>. You can still download the last saved
                  version. ({loadError})
                </AlertDescription>
                <AlertAction className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={retry}>
                    Retry
                  </Button>
                </AlertAction>
              </Alert>
            )}
          </div>
        ) : editor.isPending || !editor.data ? (
          <div className="flex flex-1 items-center justify-center gap-2 text-muted-foreground">
            <Spinner />
            Opening the editor…
          </div>
        ) : (
          <div className="flex-1" data-testid="editor-frame" data-ready={ready}>
            <DocumentEditor
              key={`${editor.data.config && (editor.data.config.document as { key: string }).key}-${attempt}`}
              id="onlyoffice-editor"
              documentServerUrl={editor.data.documentServerUrl}
              config={editor.data.config as never}
              onLoadComponentError={(code, description) => setLoadError(`${description} (code ${code})`)}
              events_onDocumentReady={() => setReady(true)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
