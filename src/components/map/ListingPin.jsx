import L from 'leaflet'
import { renderToStaticMarkup } from 'react-dom/server'
import { isUrgent } from '../../utils/foodSafety'

function PinSVG({ color, label }) {
  return (
    <div style={{
      width: 36, height: 42,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
    }}>
      <div style={{
        width: 36, height: 36,
        borderRadius: '50% 50% 50% 0',
        transform: 'rotate(-45deg)',
        background: color,
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ transform: 'rotate(45deg)', fontSize: 14 }}>{label}</span>
      </div>
      <div style={{ width: 2, height: 6, background: color, marginTop: -2 }} />
    </div>
  )
}

export function createPinIcon(listing) {
  const qty = listing.quantityRemaining
  const urgent = isUrgent(listing.expiresAt)
  const isExpired = listing.status === 'expired' || listing.status === 'claimed'

  let color = '#1B4332' // forest green
  let label = '🍽️'

  if (isExpired || qty <= 0) {
    color = '#9CA3AF' // gray
    label = '✓'
  } else if (urgent || qty === 1) {
    color = '#F59E0B' // amber
    label = '⚡'
  }

  const html = renderToStaticMarkup(<PinSVG color={color} label={label} />)

  return L.divIcon({
    html,
    className: '',
    iconSize: [36, 42],
    iconAnchor: [18, 42],
    popupAnchor: [0, -44],
  })
}

export function createUserIcon() {
  const html = `
    <div style="
      width:16px; height:16px;
      background:#3B82F6;
      border:3px solid white;
      border-radius:50%;
      box-shadow:0 2px 8px rgba(59,130,246,0.5);
    "></div>
  `
  return L.divIcon({
    html,
    className: '',
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  })
}
