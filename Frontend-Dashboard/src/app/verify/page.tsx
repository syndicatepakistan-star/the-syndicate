'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { SynCertificateCard } from '@/components/SynCertificateCard'
import { verifyCertificateToken } from '@/lib/certificates-api'
import { buildCertificateVerifyUrl } from '@/lib/certificate-public-url'
import { formatCertificateIssuedOn } from '@/lib/download-certificate'

type VerifyState =
  | { status: 'idle' | 'loading' }
  | { status: 'invalid'; message: string }
  | {
      status: 'verified'
      tokenId: string
      ownerName: string
      courseTitle: string
      issuedOn: string
    }

function readTokenFromParams(searchParams: URLSearchParams): string {
  const raw =
    searchParams.get('certificate') ||
    searchParams.get('token') ||
    searchParams.get('token_id') ||
    ''
  return raw.trim().toUpperCase()
}

function VerifyCertificateContent() {
  const searchParams = useSearchParams()
  const [state, setState] = useState<VerifyState>({ status: 'idle' })

  useEffect(() => {
    const tokenId = readTokenFromParams(searchParams)
    if (!tokenId) {
      setState({ status: 'invalid', message: 'No certificate token in this link.' })
      return
    }

    let cancelled = false
    setState({ status: 'loading' })

    void verifyCertificateToken(tokenId).then((result) => {
      if (cancelled) return
      if (!result.verified) {
        setState({
          status: 'invalid',
          message: result.message || 'This certificate could not be verified.',
        })
        return
      }

      const courseTitle = (
        result.title ||
        result.playlist_title ||
        result.course_title ||
        'Syndicate Program'
      ).trim()
      const ownerName = (result.holder_name || 'Syndicate Member').trim()
      const issuedRaw = result.issued_at ? String(result.issued_at) : ''

      setState({
        status: 'verified',
        tokenId: result.token_id || tokenId,
        ownerName,
        courseTitle,
        issuedOn: formatCertificateIssuedOn(issuedRaw),
      })
    })

    return () => {
      cancelled = true
    }
  }, [searchParams])

  return (
    <div className="min-h-[100dvh] w-full bg-[#030614] px-3 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-6">
        <header className="text-center">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.28em] text-cyan-300/80">
            Syndicate Credential Registry
          </p>
          <h1 className="mt-2 text-xl font-black uppercase tracking-[0.12em] text-cyan-50 sm:text-2xl">
            Certificate Verification
          </h1>
          <p className="mt-2 max-w-lg text-sm text-slate-300/85">
            Scan-to-verify link. Valid tokens display the official SYN credential below.
          </p>
        </header>

        {state.status === 'loading' || state.status === 'idle' ? (
          <div className="rounded-xl border border-cyan-400/30 bg-cyan-950/20 px-6 py-10 text-center text-sm text-cyan-100/90">
            Verifying certificate…
          </div>
        ) : null}

        {state.status === 'invalid' ? (
          <div className="w-full rounded-xl border border-rose-400/40 bg-rose-950/25 px-5 py-6 text-center">
            <p className="text-sm font-semibold text-rose-100">{state.message}</p>
            <p className="mt-2 text-xs text-rose-200/70">
              Check the token ID or verify from the{' '}
              <Link href="/#certificates" className="underline text-cyan-200 hover:text-cyan-100">
                home page
              </Link>
              .
            </p>
          </div>
        ) : null}

        {state.status === 'verified' ? (
          <>
            <p className="text-center text-xs font-semibold uppercase tracking-[0.16em] text-lime-300/90">
              Verified · Syndicate Certified
            </p>
            <SynCertificateCard
              ownerName={state.ownerName}
              courseTitle={state.courseTitle}
              certificateId={state.tokenId}
              issuedOn={state.issuedOn}
              verifyUrl={buildCertificateVerifyUrl(state.tokenId)}
              className="w-full max-w-[760px] shadow-[0_0_120px_rgba(56,189,248,0.15)]"
            />
          </>
        ) : null}

        <Link
          href="/"
          className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-cyan-300/75 underline-offset-4 hover:text-cyan-100 hover:underline"
        >
          Return to Syndicate
        </Link>
      </div>
    </div>
  )
}

export default function VerifyCertificatePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[100dvh] items-center justify-center bg-[#030614] text-sm text-cyan-100/80">
          Loading verification…
        </div>
      }
    >
      <VerifyCertificateContent />
    </Suspense>
  )
}
