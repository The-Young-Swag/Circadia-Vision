import { createFileRoute } from '@tanstack/react-router'
import { HomeDashboard } from '#/features/home/components/HomeDashboard'

export const Route = createFileRoute('/')({
  component: HomeDashboard,
})
