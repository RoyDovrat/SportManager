type NavIconProps = {
  name:
    | 'dashboard'
    | 'reports'
    | 'seasons'
    | 'activities'
    | 'pricing'
    | 'registrations'
    | 'clothing'
    | 'payments'
    | 'groups'
    | 'export'
    | 'public'
    | 'logout'
}

const paths: Record<NavIconProps['name'], string> = {
  dashboard:
    'M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z',
  reports:
    'M5 19V5h4v14H5Zm5 0V9h4v10h-4Zm5 0V3h4v16h-4Z',
  seasons:
    'M12 3a9 9 0 1 0 9 9h-9V3Z',
  activities:
    'M12 3 14.5 9.5 21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z',
  pricing:
    'M12 3v18M7 7.5c1.5-1.5 8-2 8 1.5S9 12 9 12s6 1 6 4.5-6.5 3-8 1.5',
  registrations:
    'M8 7h12M8 12h12M8 17h8M4 7h.01M4 12h.01M4 17h.01',
  clothing:
    'M9 4 7 7l-3 1 2 3v7h12v-7l2-3-3-1-2-3-2 1.5L9 4Z',
  payments:
    'M3 7h18v10H3V7Zm0 3h18M7 15h4',
  groups:
    'M9 11a3 3 0 1 0-3-3 3 3 0 0 0 3 3Zm9 0a3 3 0 1 0-3-3 3 3 0 0 0 3 3ZM3 19a5 5 0 0 1 10 0M14 19a5 5 0 0 1 7 0',
  export:
    'M12 3v12m0 0 4-4m-4 4-4-4M5 19h14',
  public:
    'M12 3a9 9 0 1 0 9 9A9 9 0 0 0 12 3Zm0 0c2.5 2.5 4 5.5 4 9s-1.5 6.5-4 9m0-18c-2.5 2.5-4 5.5-4 9s1.5 6.5 4 9M3.5 12h17',
  logout:
    'M10 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h5m5-8H9m6 0 3-3m-3 3 3 3',
}

export function NavIcon({ name }: NavIconProps) {
  return (
    <svg
      className="nav-icon"
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={paths[name]} />
    </svg>
  )
}
