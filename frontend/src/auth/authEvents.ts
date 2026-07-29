export const UNAUTHORIZED_EVENT = 'sportmanager:unauthorized'

export function notifyUnauthorized(): void {
  window.dispatchEvent(new Event(UNAUTHORIZED_EVENT))
}
