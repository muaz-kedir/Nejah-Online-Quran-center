import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/debug-user')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/debug-user"!</div>
}
