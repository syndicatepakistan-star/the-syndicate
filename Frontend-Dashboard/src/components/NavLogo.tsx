import Image from 'next/image'

export default function NavLogo() {
  return (
    <div className="flex items-center" data-logo="gun" aria-label="Logo">
      <Image
        src="/assets/logo.webp"
        alt="syndicate Logo"
        width={152}
        height={51}
        sizes="(max-width: 639px) 96px, (max-width: 767px) 120px, 152px"
        priority
        className="hamburger-attract h-8 w-auto sm:h-10 md:h-12"
        style={{ filter: 'drop-shadow(0 0 14px rgba(251,191,36,0.35))' }}
      />
    </div>
  )
}
