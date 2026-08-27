import { Logo } from './Logo';

const APP = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

export function Footer() {
  return (
    <footer className="bg-brand text-white">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-6 py-10 sm:flex-row">
        <div className="flex items-center gap-2">
          <Logo size={28} wordmark={false} />
          <span className="font-bold">
            Unika<span className="text-brand-gold">Love</span>
          </span>
        </div>
        <nav className="flex flex-wrap items-center gap-6 text-sm text-white/85">
          <a href="#features" className="hover:text-white">
            Pourquoi nous
          </a>
          <a href="#pricing" className="hover:text-white">
            Tarifs
          </a>
          <a href={`${APP}/register`} className="hover:text-white">
            S&apos;inscrire
          </a>
          <a href={`${APP}/login`} className="hover:text-white">
            Se connecter
          </a>
        </nav>
        <p className="text-xs text-white/70">
          © {new Date().getFullYear()} UnikaLove — Connecter les cœurs, célébrer l&apos;amour.
        </p>
      </div>
    </footer>
  );
}
