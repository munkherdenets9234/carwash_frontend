/**
 * The /book area as a whole, which is no longer one thing.
 *
 * There is deliberately NO guard here. Booking a wash and finding one with
 * its code are open; the garage and the booking history live under (account)
 * and are guarded by that group's own layout. Putting a check back in this
 * file would silently close the public half again, which is exactly what it
 * did before.
 */
export default function BookLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
