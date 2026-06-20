import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { useAppDataStore, AppDataProvider } from "../lib/ridelog";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no",
      },
      { name: "theme-color", content: "#000000" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "apple-mobile-web-app-title", content: "RideLog" },
      { name: "mobile-web-app-capable", content: "yes" },
      { title: "RideLog Pro" },
      {
        name: "description",
        content:
          "Premium offline ride & fuel companion for scooter and motorcycle owners. No login. No ads.",
      },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "icon", href: "/icon-512.png", type: "image/png" },
      { rel: "apple-touch-icon", href: "/icon-512.png" },
      {
        rel: "preconnect",
        href: "https://fonts.googleapis.com",
      },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function AppSkeleton() {
  return (
    <div className="fixed inset-0 bg-background">
      <div className="mx-auto max-w-md px-5 pt-12 pb-8 space-y-5 animate-pulse">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between pb-2">
          <div className="space-y-2">
            <div className="h-3.5 w-24 rounded bg-surface" />
            <div className="h-5 w-36 rounded bg-surface" />
          </div>
          <div className="h-8 w-8 rounded-full bg-surface" />
        </div>

        {/* Hero Card Skeleton */}
        <div className="rounded-[28px] bg-surface h-48 w-full hairline" />

        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-[28px] bg-surface h-20 w-full hairline" />
          <div className="rounded-[28px] bg-surface h-20 w-full hairline" />
          <div className="rounded-[28px] bg-surface h-20 w-full hairline" />
        </div>

        {/* Middle Card Skeleton */}
        <div className="rounded-[28px] bg-surface h-24 w-full hairline" />

        {/* Lower list Skeleton */}
        <div className="space-y-3">
          <div className="h-4 w-28 rounded bg-surface" />
          <div className="rounded-[28px] bg-surface h-16 w-full hairline" />
          <div className="rounded-[28px] bg-surface h-16 w-full hairline" />
        </div>
      </div>

      {/* Bottom Nav Skeleton */}
      <div className="fixed bottom-0 inset-x-0 bg-surface/85 backdrop-blur-md border-t border-border/40 py-3.5 px-6 pb-[calc(1rem + env(safe-area-inset-bottom,12px))]">
        <div className="mx-auto max-w-md flex justify-between items-center px-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5 opacity-40">
              <div className="h-5 w-5 rounded bg-muted" />
              <div className="h-2 w-10 rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const store = useAppDataStore();

  if (!store.ready) {
    return <AppSkeleton />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AppDataProvider value={store}>
        {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
        <Outlet />
      </AppDataProvider>
    </QueryClientProvider>
  );
}
