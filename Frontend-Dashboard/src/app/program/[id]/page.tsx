import { redirect } from 'next/navigation'

type Props = {
  params: Promise<{ id: string }>
}

export default async function ProgramDeepLinkPage({ params }: Props) {
  const { id } = await params
  const programId = Number.parseInt(id, 10)
  if (!Number.isFinite(programId) || programId <= 0) {
    redirect('/programs')
  }
  redirect(`/programs?program=${programId}#programs-library`)
}
