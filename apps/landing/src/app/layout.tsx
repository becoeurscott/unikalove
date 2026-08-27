import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
import './globals.css';
import { SmoothScroll } from '@/components/SmoothScroll';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'UnikaLove — L’amour n’a pas de frontières',
  description:
    'Rencontrez des personnes sincères et construisez une histoire vraie. Le dating repensé pour l’Afrique et sa diaspora.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className={poppins.className}>
        <SmoothScroll>{children}</SmoothScroll>
      </body>
    </html>
  );
}
