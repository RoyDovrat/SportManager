import { NavIcon } from './NavIcon'

type FilterClearButtonProps = {
  onClick: () => void
  disabled?: boolean
  children: string
}

export function FilterClearButton({
  onClick,
  disabled,
  children,
}: FilterClearButtonProps) {
  return (
    <button
      type="button"
      className="admin-filters__clear"
      onClick={onClick}
      disabled={disabled}
    >
      <NavIcon name="clear" />
      {children}
    </button>
  )
}
