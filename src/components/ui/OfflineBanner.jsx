import { WifiSlash } from '@phosphor-icons/react'
import { useOnlineStatus } from '../../hooks/useOnlineStatus'

export default function OfflineBanner() {
  const isOnline = useOnlineStatus()
  if (isOnline) return null

  return (
    <div className="fixed top-0 inset-x-0 z-50 bg-amber-500 text-white px-4 py-2 flex items-center gap-2 justify-center safe-top">
      <WifiSlash size={16} weight="fill" />
      <span className="text-sm font-medium font-body">You're offline — viewing cached content</span>
    </div>
  )
}
