import { Button } from '@/components/ui/button.tsx';

import { isRouteErrorResponse, useRouteError } from 'react-router-dom';

export default function RouteError() {
  const error = useRouteError();

  let title = 'Something went wrong';
  let description = 'An unexpected error occurred. Please try reloading the page.';

  if (isRouteErrorResponse(error)) {
    title = `${error.status} ${error.statusText}`.trim();
    description =
      typeof error.data === 'string' && error.data
        ? error.data
        : 'The requested page could not be loaded.';
  } else if (error instanceof Error && error.message) {
    description = error.message;
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6">
      <div className="border-border bg-card w-full max-w-lg rounded-2xl border p-8 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-muted-foreground mt-3 text-sm">{description}</p>
        <div className="mt-6 flex gap-3">
          <Button onClick={() => window.location.reload()}>Reload</Button>
          <Button variant="outline" onClick={() => window.history.back()}>
            Go back
          </Button>
        </div>
      </div>
    </div>
  );
}
