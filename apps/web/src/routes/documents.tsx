import { kindOf, type DocumentDto } from '@otl/shared';
import { DownloadIcon, FolderOpenIcon, PencilIcon } from 'lucide-react';
import { Link, useLocation } from 'react-router';
import { useDocuments } from '@/api/hooks';
import { Page } from '@/components/app-shell';
import { ErrorState } from '@/components/states';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { KIND_ICONS } from '@/lib/kind-icons';
import { timeAgo } from '@/lib/format';

/** My documents (CAP-7). Polls briefly after the editor closes so the saved version appears. */
export function DocumentsRoute() {
  const location = useLocation();
  const closedAt = (location.state as { editorClosedAt?: number } | null)?.editorClosedAt;
  const documents = useDocuments({ pollUntil: closedAt ? closedAt + 30_000 : undefined });
  const items = documents.data?.items ?? [];

  return (
    <Page title="My documents" description="Documents you created from templates. Open one to keep editing, or download it.">
      {documents.isPending ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : documents.isError ? (
        <ErrorState title="Couldn't load your documents." error={documents.error} onRetry={() => documents.refetch()} />
      ) : items.length === 0 ? (
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
