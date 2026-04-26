import { ReactNode } from "react";

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="min-w-0 flex-1">
        <h1 className="text-xl font-bold tracking-tight text-foreground md:text-2xl lg:text-[28px]">{title}</h1>
        {description && <p className="mt-1 text-xs text-muted-foreground md:text-sm">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 md:mt-0">{actions}</div>}
    </div>
  );
}

export function StatusBadge({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${className}`}>
      {children}
    </span>
  );
}

export function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 animate-slide-up rounded-xl border border-border bg-card px-4 py-3 shadow-elevated">
      <div className="flex items-center gap-3">
        <div className="h-2 w-2 rounded-full bg-success" />
        <p className="text-sm font-medium">{message}</p>
        <button onClick={onClose} className="ml-2 text-muted-foreground hover:text-foreground">×</button>
      </div>
    </div>
  );
}
