import { getInitials, avatarColor, cn } from '../../utils/helpers'
import { AVATAR_COLORS } from '../../utils/constants'

function Avatar({ name, size = 'md', className }) {
  const color = avatarColor(name, AVATAR_COLORS)
  const sizeStyles = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-14 w-14 text-lg',
    xl: 'h-20 w-20 text-2xl',
  }
  return (
    <div
      className={cn(
        'flex shrink-0 select-none items-center justify-center rounded-full font-bold text-white shadow-sm',
        color,
        sizeStyles[size],
        className,
      )}
    >
      {getInitials(name)}
    </div>
  )
}

export default Avatar
