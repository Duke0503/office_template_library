import { kindOf, type TemplateSummaryDto } from '@otl/shared';
import { ArrowLeftIcon, ArrowRightIcon, SearchXIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { useCreateDocument, useTemplate } from '@/api/hooks';
import { isNotFound } from '@/api/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { countLabel } from '@/lib/format';
import { cn } from '@/lib/utils';
import { ErrorState } from './states';

interface Props {
  templateId: string | null;
  /** Gallery data shown at once while the detail loads. */
  summary?: TemplateSummaryDto;
  onClose: () => void;
}

/** Template preview (CAP-3) and "Use template" (CAP-4). Full-screen on phone. */
export function PreviewDialog({ templateId, summary, onClose }: Props) {
  const detail = useTemplate(templateId);
  const create = useCreateDocument();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);

  useEffect(() => setPage(1), [templateId]);

  const template = detail.data ?? summary;
  const previews = detail.data?.previews ?? [];
  const total = previews.length;
  const unit = template ? kindOf(template.kind).previewUnit : 'page';
  const archived = detail.data?.status === 'archived';

  useEffect(() => {
    if (!templateId || total === 0) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') setPage((p) => Math.min(total, p + 1));
      if (e.key === 'ArrowLeft') setPage((p) => Math.max(1, p - 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [templateId, total]);

  const useTemplateNow = () => {
    if (!templateId) return;
    create.mutate(templateId, {
      onSuccess: (document) => navigate(`/documents/${document.id}/edit`),
      onError: () => toast.error("Couldn't create the document. Try again."),
    });
  };

  return (
    <Dialog open={Boolean(templateId)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex h-svh max-h-svh w-full max-w-full flex-col gap-0 overflow-hidden rounded-none p-0 sm:max-w-full md:h-[min(90svh,820px)] md:w-[min(94vw,1100px)] md:max-w-[min(94vw,1100px)] md:rounded-[10px]">
        {detail.isError && isNotFound(detail.error) ? (
          <div className="flex flex-1 items-center justify-center p-6">
            <DialogTitle className="sr-only">Template not found</DialogTitle>
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <SearchXIcon />
                </EmptyMedia>
                <EmptyTitle>This template no longer exists</EmptyTitle>
                <EmptyDescription>It may have been removed from the library.</EmptyDescription>
              </EmptyHeader>
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </Empty>
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col md:flex-row">
            {/* Stage and filmstrip */}
            <div className="flex min-h-0 flex-1 flex-col bg-thumbnail-backdrop">
              <div className="relative flex min-h-0 flex-1 items-center justify-center p-4 md:p-8">
                {detail.isError ? (
                  <ErrorState title="Couldn't load the preview." error={detail.error} onRetry={() => detail.refetch()} />
                ) : total === 0 ? (
                  <Skeleton className="h-full max-h-[70svh] w-3/5" />
                ) : (
                  <img
                    key={previews[page - 1]?.url}
                    src={previews[page - 1]?.url}
                    alt={`${template?.name}, ${unit} ${page} of ${total}`}
                    className="max-h-full max-w-full bg-white object-contain shadow-md"
                  />
                )}
                {total > 1 && (
                  <>
                    <Button variant="secondary" size="icon" className="absolute top-1/2 left-3 -translate-y-1/2" aria-label={`Previous ${unit}`} disabled={page === 1} onClick={() => setPage(page - 1)}>
                      <ArrowLeftIcon />
                    </Button>
                    <Button variant="secondary" size="icon" className="absolute top-1/2 right-3 -translate-y-1/2" aria-label={`Next ${unit}`} disabled={page === total} onClick={() => setPage(page + 1)}>
                      <ArrowRightIcon />
                    </Button>
                  </>
                )}
              </div>
              {total > 1 && (
                <div className="flex gap-2 overflow-x-auto border-t bg-background/60 p-3" role="list" aria-label={`${unit}s`}>
                  {previews.map((p) => (
                    <button
                      key={p.n}
                      type="button"
                      role="listitem"
                      aria-label={`${unit === 'page' ? 'Page' : 'Slide'} ${p.n} of ${total}`}
                      aria-current={p.n === page}
                      onClick={() => setPage(p.n)}
                      className={cn(
                        'shrink-0 overflow-hidden rounded-sm border-2 border-transparent bg-white outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
                        p.n === page && 'border-primary',
                      )}
                    >
                      <img src={p.url} alt="" className="h-16 w-auto" loading="lazy" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Info panel */}
            <aside className="flex shrink-0 flex-col gap-4 border-t p-5 md:w-80 md:border-t-0 md:border-l md:p-6">
              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  {template && <Badge variant="secondary">{template.category.name}</Badge>}
                  {archived && <Badge variant="outline">Archived</Badge>}
                </div>
                <DialogTitle className="text-xl leading-tight font-semibold">{template?.name ?? 'Loading template…'}</DialogTitle>
                {template && (
                  <p className="text-sm text-muted-foreground">
                    {kindOf(template.kind).label} · {countLabel(template.kind, template.previewCount)}
                  </p>
                )}
              </div>
              <DialogDescription className="text-sm text-foreground/80">{template?.description}</DialogDescription>
              <div className="mt-auto flex flex-col gap-2">
                {archived && <p className="text-sm text-muted-foreground">This template was retired. Documents made from it still work.</p>}
                <Button size="lg" className="h-11 w-full" onClick={useTemplateNow} disabled={!template || archived || create.isPending}>
                  {create.isPending ? (
                    <>
                      <Spinner data-icon="inline-start" />
                      Creating your document…
                    </>
                  ) : (
                    'Use template'
                  )}
                </Button>
                <p className="text-center text-xs text-muted-foreground">Creates your own copy. The template stays unchanged.</p>
              </div>
            </aside>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
