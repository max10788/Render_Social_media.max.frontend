import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import EthereumProvider from '@/web3/EthereumProvider'; // KORRIGIERT: components/web3 -> web3

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Monte-Carlo Basket-Option Pricing',
  description: 'Advanced pricing engine for cryptocurrency basket options',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <EthereumProvider />
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
