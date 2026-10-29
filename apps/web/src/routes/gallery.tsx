import { isTemplateKind, kindOf, type TemplateKind } from '@otl/shared';
import { SearchIcon, SearchXIcon, XIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router';
import { useCategories, useTemplates } from '@/api/hooks';
import { Page } from '@/components/app-shell';
import { PreviewDialog } from '@/components/preview-dialog';
import { ErrorState, NotFoundState } from '@/components/states';
import { TemplateCard, TemplateCardSkeleton } from '@/components/template-card';
import { Button } from '@/components/ui/button';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group';
import { Skeleton } from '@/components/ui/skeleton';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

export function GalleryRoute() {
  const { kind } = useParams();
  if (!isTemplateKind(kind)) {
    return <NotFoundState title="Page not found" description="There is no gallery at this address." linkTo="/" linkLabel="Go to templates" />;
  }
  return <Gallery key={kind} kind={kind} />;
}

/** Gallery state lives in the URL: q, category and preview (AD-10). */
function Gallery({ kind }: { kind: TemplateKind }) {
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const category = params.get('category') ?? '';
  const previewId = params.get('preview');

  const update = (patch: Record<string, string | null>, replace = true) => {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(patch)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    setParams(next, { replace });
  };

  // Debounced search box (250 ms) that writes to the URL.
  const [draft, setDraft] = useState(q);
  useEffect(() => setDraft(q), [q]);
  useEffect(() => {
    if (draft === q) return;
    const t = setTimeout(() => update({ q: draft.trim() || null }), 250);
    return () => clearTimeout(t);
  }, [draft]);

  const searchRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '/' && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const templates = useTemplates(kind, q, category);
  const categories = useCategories(kind);
  const items = templates.data?.items ?? [];
  const filtered = Boolean(q || category);
  const categoryName = categories.data?.items.find((c) => c.slug === category)?.name;
  const def = kindOf(kind);

  return (
    <Page title={`${def.label} templates`} description={`Pick a ${def.label.toLowerCase()} template, preview it, and create your own copy to edit.`}>
      <div className="flex flex-col gap-4">
        <InputGroup className="h-10 max-w-md">
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
          <InputGroupInput
            ref={searchRef}
            type="search"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={`Search ${def.pluralLabel.toLowerCase()}…`}
            aria-label={`Search ${def.label.toLowerCase()} templates`}
          />
          {draft && (
            <InputGroupAddon align="inline-end">
              <InputGroupButton size="icon-xs" aria-label="Clear search" onClick={() => setDraft('')}>
                <XIcon />
              </InputGroupButton>
            </InputGroupAddon>
          )}
        </InputGroup>

        {categories.isPending ? (
          <div className="flex gap-2">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-8 w-24" />
            ))}
          </div>
        ) : categories.data ? (
          <div className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
            <ToggleGroup
              type="single"
              variant="outline"
              value={category || 'all'}
              onValueChange={(value) => update({ category: value && value !== 'all' ? value : null })}
              aria-label="Filter by category"
              className="w-max"
            >
              <ToggleGroupItem value="all">All</ToggleGroupItem>
              {categories.data.items.map((c) => (
                <ToggleGroupItem key={c.slug} value={c.slug}>
                  {c.name}
                  <span className="text-muted-foreground tabular-nums">{c.templateCount}</span>
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
        ) : null}
      </div>

      <p className="sr-only" aria-live="polite">
        {templates.isSuccess && (items.length ? `${items.length} templates` : 'No templates match')}
      </p>

      {templates.isPending ? (
        <Grid>
          {Array.from({ length: 8 }, (_, i) => (
            <TemplateCardSkeleton key={i} />
          ))}
        </Grid>
      ) : templates.isError ? (
        <ErrorState title="Couldn't load templates." error={templates.error} onRetry={() => templates.refetch()} />
      ) : items.length === 0 ? (
        <Empty className="border py-12">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <SearchXIcon />
            </EmptyMedia>
            <EmptyTitle>{q ? `No templates match "${q}"${categoryName ? ` in ${categoryName}` : ''}` : filtered ? `No templates in ${categoryName ?? 'this category'}` : 'No templates yet'}</EmptyTitle>
            <EmptyDescription>{filtered ? 'Try another word or clear the filters.' : 'Add templates to templates/manifest.json and run the import.'}</EmptyDescription>
          </EmptyHeader>
          {filtered && (
            <EmptyContent>
              <Button variant="outline" onClick={() => update({ q: null, category: null })}>
                Clear filters
              </Button>
            </EmptyContent>
          )}
        </Empty>
      ) : (
        <Grid>
          {items.map((t) => (
            <TemplateCard key={t.id} template={t} onOpen={() => update({ preview: t.id }, false)} />
          ))}
        </Grid>
      )}

      <PreviewDialog templateId={previewId} summary={items.find((t) => t.id === previewId)} onClose={() => update({ preview: null })} />
    </Page>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-5">{children}</div>;
}
