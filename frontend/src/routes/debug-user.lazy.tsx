/* eslint-disable */
// @ts-nocheck
// Lazy component (code-split). Do not edit.

import { createLazyFileRoute} from '@tanstack/react-router'

export const Route = createLazyFileRoute('/debug-user')({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/debug-user"!</div>
}
