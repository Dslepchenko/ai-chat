import { FileText, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface DocumentTagProps {
  filename: string
  onRemove?: () => void
}

export function DocumentTag({ filename, onRemove }: DocumentTagProps) {
  return (
    <Badge variant="secondary" className="gap-1.5 max-w-[180px]">
      <FileText className="size-3 shrink-0" />
      <span className="truncate">{filename}</span>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="ml-0.5 shrink-0 rounded-full opacity-70 hover:opacity-100 focus:outline-none"
        >
          <X className="size-3" />
          <span className="sr-only">Remove {filename}</span>
        </button>
      )}
    </Badge>
  )
}
