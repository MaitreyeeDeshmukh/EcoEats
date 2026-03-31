import { Star } from '@phosphor-icons/react'
import { getInitials, getAvatarColor, formatRelativeTime } from '../../utils/formatters'

export default function ReviewCard({ review }) {
  const { userName, userPhotoURL, rating, comment, ecoRating, createdAt } = review

  return (
    <div className="py-4 border-b border-neutral-100 last:border-0">
      <div className="flex items-start gap-3">
        <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-semibold text-white ${getAvatarColor(userName)}`}>
          {userPhotoURL ? (
            <img src={userPhotoURL} alt={userName} className="w-8 h-8 rounded-full object-cover" />
          ) : getInitials(userName)}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-neutral-900">{userName}</span>
            <span className="text-xs text-neutral-400">{formatRelativeTime(createdAt)}</span>
          </div>

          <div className="flex items-center gap-1 mb-2">
            {Array.from({ length: 5 }, (_, i) => (
              <Star
                key={i}
                size={13}
                weight={i < rating ? 'fill' : 'regular'}
                className={i < rating ? 'text-yellow-400' : 'text-neutral-300'}
              />
            ))}
          </div>

          {comment && <p className="text-sm text-neutral-700 leading-relaxed">{comment}</p>}
        </div>
      </div>
    </div>
  )
}
