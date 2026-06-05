import { TripTabNav } from '@/components/trips/TripTabNav'

interface Props {
  children: React.ReactNode
  params: Promise<{ id: string }>
}

export default async function TripLayout({ children, params }: Props) {
  const { id } = await params
  return (
    <div>
      <TripTabNav tripId={id} />
      {children}
    </div>
  )
}
