/** Indeterminate linear progress indicator (4dp). */
export function LinearProgress({ label }: { label: string }) {
  return (
    <div role="progressbar" aria-label={label} className="relative h-1 overflow-hidden bg-primary/24">
      <div className="md-progress-bar absolute inset-y-0 w-2/5 bg-primary" />
    </div>
  )
}
