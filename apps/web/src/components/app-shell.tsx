import { FolderOpenIcon, LayoutTemplateIcon, MenuIcon } from 'lucide-react';
import { useState } from 'react';
import { NavLink, Outlet } from 'react-router';
import { KINDS, TEMPLATE_KINDS } from '@otl/shared';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { KIND_ICONS } from '@/lib/kind-icons';
import { cn } from '@/lib/utils';
import { ThemeToggle } from './theme-toggle';

const NAV = [
  ...TEMPLATE_KINDS.map((kind) => ({ to: `/templates/${kind}`, label: KINDS[kind].pluralLabel, icon: KIND_ICONS[kind] })),
  { to: '/documents', label: 'My documents', icon: FolderOpenIcon },
];

function NavItems({ onNavigate, vertical = false }: { onNavigate?: () => void; vertical?: boolean }) {
  return NAV.map(({ to, label, icon: Icon }) => (
    <NavLink
      key={to}
      to={to}
      end={to === '/documents'}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-2 rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none',
          vertical ? 'h-11' : 'h-14 rounded-none border-b-2 border-transparent',
          isActive && 'text-primary hover:text-primary',
          isActive && !vertical && 'border-primary',
        )
      }
    >
      <Icon className="size-4" aria-hidden />
      {label}
    </NavLink>
  ));
}

export function AppShell() {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className="flex min-h-svh flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4 md:px-8">
          <NavLink to="/" className="flex items-center gap-2 font-semibold">
            <LayoutTemplateIcon className="size-5 text-primary" aria-hidden />
            Template Library
          </NavLink>
          <nav aria-label="Main" className="ml-4 hidden items-center gap-1 md:flex">
            <NavItems />
          </nav>
          <div className="ml-auto flex items-center gap-1">
            <ThemeToggle />
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
                  <MenuIcon />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72">
                <SheetHeader>
                  <SheetTitle>Template Library</SheetTitle>
                </SheetHeader>
                <nav aria-label="Main" className="flex flex-col gap-1 px-2">
                  <NavItems vertical onNavigate={() => setMenuOpen(false)} />
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
      <main className="flex flex-1 flex-col">
        <Outlet />
      </main>
    </div>
  );
}

/** Standard page frame: capped width and the DESIGN.md gutters. */
export function Page({ title, description, actions, children }: { title: string; description?: string; actions?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 md:px-8 md:py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {description && <p className="text-muted-foreground">{description}</p>}
        </div>
        {actions}
      </div>
      {children}
    </div>
  );
}
