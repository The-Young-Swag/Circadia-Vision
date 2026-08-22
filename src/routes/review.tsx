import { createFileRoute } from '@tanstack/react-router'

import { ReviewPage } from '#/features/review/components/ReviewPage'

export const Route = createFileRoute('/review')({
  component: ReviewPage,
})