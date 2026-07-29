type AdminPlaceholderPageProps = {
  title: string
  description: string
}

export function AdminPlaceholderPage({ title, description }: AdminPlaceholderPageProps) {
  return (
    <section>
      <h1>{title}</h1>
      <p>{description}</p>
      <p className="admin-placeholder__note">UI for this area will be added in the next F2 steps.</p>
    </section>
  )
}
