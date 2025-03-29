import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Button } from '@/components/ui/button'
import { Github } from 'lucide-react'

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Switchblade Athena API",
  description: "A powerful API for data analysis and querying",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen flex flex-col">
          <header className="border-b">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <h1 className="text-xl font-bold">Switchblade</h1>
                <nav className="hidden md:flex space-x-6">
                  <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
                  <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Documentation</a>
                  <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
                </nav>
              </div>
              <div className="flex items-center space-x-4">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
                <Button size="sm">
                  Get Started
                </Button>
              </div>
            </div>
          </header>

          <main className="flex-1">
            {children}
          </main>

          <footer className="border-t py-8">
            <div className="container mx-auto px-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div>
                  <h3 className="font-semibold mb-4">Switchblade</h3>
                  <p className="text-sm text-muted-foreground">
                    A powerful data analysis platform built with AWS Athena and Next.js.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-4">Product</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li><a href="#" className="hover:text-foreground transition-colors">Features</a></li>
                    <li><a href="#" className="hover:text-foreground transition-colors">Documentation</a></li>
                    <li><a href="#" className="hover:text-foreground transition-colors">Pricing</a></li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-4">Company</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li><a href="#" className="hover:text-foreground transition-colors">About</a></li>
                    <li><a href="#" className="hover:text-foreground transition-colors">Blog</a></li>
                    <li><a href="#" className="hover:text-foreground transition-colors">Careers</a></li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-4">Legal</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li><a href="#" className="hover:text-foreground transition-colors">Privacy</a></li>
                    <li><a href="#" className="hover:text-foreground transition-colors">Terms</a></li>
                    <li><a href="#" className="hover:text-foreground transition-colors">Security</a></li>
                  </ul>
                </div>
              </div>
              <div className="mt-8 pt-8 border-t flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  © 2024 Switchblade. All rights reserved.
                </p>
                <div className="flex items-center space-x-4">
                  <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                    <Github className="w-5 h-5" />
                  </a>
                  <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                    Twitter
                  </a>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
