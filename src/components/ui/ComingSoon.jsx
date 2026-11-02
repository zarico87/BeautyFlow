import Card from './Card'
import PageHeader from './PageHeader'

/**
 * Pantalla para módulos todavía no desarrollados.
 * @param {{ title: string, description: string }} props
 */
export default function ComingSoon({ title, description }) {
  return (
    <>
      <PageHeader title={title} />
      <Card>
        <p className="text-sm text-taupe">{description}</p>
      </Card>
    </>
  )
}
