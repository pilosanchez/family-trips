import { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-stone-400" />
      </div>
      <h3 className="text-sm font-medium text-stone-900 mb-1">{title}</h3>
      {description && <p className="text-sm text-stone-500 mb-4 max-w-xs">{description}</p>}
      {action}
    </div>
  )
}
