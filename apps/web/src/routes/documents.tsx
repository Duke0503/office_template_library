import { isTemplateKind, kindOf, TEMPLATE_KINDS, type DocumentDto } from '@otl/shared';
import { DownloadIcon, FolderOpenIcon, PencilIcon, SearchIcon, SearchXIcon, XIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router';
import { useDocuments } from '@/api/hooks';
import { Page } from '@/components/app-shell';
import { ErrorState } from '@/components/states';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { KIND_ICONS } from '@/lib/kind-icons';
import { timeAgo } from '@/lib/format';

/**
 * My documents (CAP-7). Polls briefly after the editor closes so the saved version appears.
 * Search (`q`) and type (`kind`) live in the URL and filter client-side: it is one local user's list.
 */
export function DocumentsRoute() {
  const location = useLocation();
  const closedAt = (location.state as { editorClosedAt?: number } | null)?.editorClosedAt;
  const documents = useDocuments({ pollUntil: closedAt ? closedAt + 30_000 : undefined });
  const all = documents.data?.items ?? [];

  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const kindParam = params.get('kind');
  const kind = isTemplateKind(kindParam) ? kindParam : null;

  const update = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(patch)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    // Keep the editor-closed state so polling survives filter changes.
    setParams(next, { replace: true, state: location.state });
  };

  // Debounced search box (250 ms) that writes to the URL, as in the gallery.
  const [draft, setDraft] = useState(q);
  useEffect(() => setDraft(q), [q]);
  useEffect(() => {
    if (draft === q) return;
    const t = setTimeout(() => update({ q: draft.trim() || null }), 250);
    return () => clearTimeout(t);
  }, [draft]);

  const needle = q.toLowerCase();
  const items = all.filter(
    (d) =>
      (!kind || d.kind === kind) &&
      (!needle || d.title.toLowerCase().includes(needle) || d.origin.templateName.toLowerCase().includes(needle)),
  );
  const filtered = Boolean(q || kind);

  return (
    <Page title="My documents" description="Documents you created from templates. Open one to keep editing, or download it.">
      {all.length > 0 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <InputGroup className="h-10 sm:max-w-sm">
            <InputGroupAddon>
              <SearchIcon />
            </InputGroupAddon>
            <InputGroupInput
              type="search"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Search by title or template…"
              aria-label="Search my documents"
            />
            {draft && (
              <InputGroupAddon align="inline-end">
                <InputGroupButton size="icon-xs" aria-label="Clear search" onClick={() => setDraft('')}>
                  <XIcon />
                </InputGroupButton>
              </InputGroupAddon>
            )}
          </InputGroup>
          <ToggleGroup
            type="single"
            variant="outline"
            value={kind ?? 'all'}
            onValueChange={(value) => update({ kind: value && value !== 'all' ? value : null })}
            aria-label="Filter by type"
            className="w-max"
          >
            <ToggleGroupItem value="all">All</ToggleGroupItem>
            {TEMPLATE_KINDS.map((k) => (
              <ToggleGroupItem key={k} value={k}>
                {kindOf(k).pluralLabel}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      )}

      <p className="sr-only" aria-live="polite">
        {documents.isSuccess && filtered && (items.length ? `${items.length} documents` : 'No documents match')}
      </p>

      {documents.isPending ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : documents.isError ? (
        <ErrorState title="Couldn't load your documents." error={documents.error} onRetry={() => documents.refetch()} />
      ) : all.length === 0 ? (
        <Empty className="border py-12">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FolderOpenIcon />
            </EmptyMedia>
            <EmptyTitle>No documents yet</EmptyTitle>
            <EmptyDescription>Pick a template to start.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent className="flex-row justify-center">
            <Button asChild>
              <Link to="/templates/docx">Document templates</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/templates/pptx">Presentation templates</Link>
            </Button>
          </EmptyContent>
        </Empty>
      ) : items.length === 0 ? (
        <Empty className="border py-12">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <SearchXIcon />
            </EmptyMedia>
            <EmptyTitle>{q ? `No documents match "${q}"` : `No ${kindOf(kind!).pluralLabel.toLowerCase()} yet`}</EmptyTitle>
            <EmptyDescription>Try another word or clear the filters.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button variant="outline" onClick={() => update({ q: null, kind: null })}>
              Clear filters
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <>
          <div className="hidden rounded-[10px] border md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>From template</TableHead>
                  <TableHead className="text-right">Version</TableHead>
                  <TableHead>Last saved</TableHead>
                  <TableHead className="pr-4 text-right">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((d) => (
                  <TableRow key={d.id} data-testid="document-row">
                    <TableCell className="pl-4 font-medium">{d.title}</TableCell>
                    <TableCell>
                      <KindLabel document={d} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {d.origin.templateName} <span className="text-xs">(rev. {d.origin.revision})</span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums" data-testid="document-version">{d.version}</TableCell>
                    <TableCell className="text-muted-foreground">
                      <time dateTime={d.updatedAt} title={new Date(d.updatedAt).toLocaleString()}>
                        {timeAgo(d.updatedAt)}
                      </time>
                    </TableCell>
                    <TableCell className="pr-4">
                      <Actions document={d} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <ul className="flex flex-col gap-3 md:hidden">
            {items.map((d) => (
              <li key={d.id} className="flex flex-col gap-3 rounded-[10px] border p-4" data-testid="document-row">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-col gap-1">
                    <span className="font-medium">{d.title}</span>
                    <span className="text-sm text-muted-foreground">
                      Version {d.version} · saved {timeAgo(d.updatedAt)}
                    </span>
                  </div>
                  <KindLabel document={d} />
                </div>
                <Actions document={d} />
              </li>
            ))}
          </ul>
        </>
      )}
    </Page>
  );
}

function KindLabel({ document }: { document: DocumentDto }) {
  const Icon = KIND_ICONS[document.kind];
  return (
    <Badge variant="outline">
      <Icon data-icon="inline-start" />
      {kindOf(document.kind).label}
    </Badge>
  );
}

function Actions({ document }: { document: DocumentDto }) {
  return (
    <div className="flex justify-end gap-2">
      <Button asChild variant="outline" size="sm">
        <a href={document.downloadUrl} download>
          <DownloadIcon data-icon="inline-start" />
          Download
        </a>
      </Button>
      <Button asChild size="sm">
        <Link to={`/documents/${document.id}/edit`}>
          <PencilIcon data-icon="inline-start" />
          Open
        </Link>
      </Button>
    </div>
  );
}
