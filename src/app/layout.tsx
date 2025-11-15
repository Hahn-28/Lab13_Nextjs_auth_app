import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { Geist, Geist_Mono } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import LogoutButton from "./components/LogoutButton";
import Provider from "./components/SessionProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: " Next Auth App",
  description: "My Next Auth App",
};

export default  async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);
  console.log(session);
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        
        <nav className="w-full bg-black shadow-sm">
          <div className="container mx-6 py-4 flex items-center justify-between text-white">
            <Link href="/" className="text-xl font-semibold hover:text-gray-300">
              MyAuthApp
            </Link>
            <ul className="flex items-center justify-center gap-6 text-sm">
              <li>
                <Link href="/dashboard" className="hover:text-gray-300">
                  Dashboard
                </Link>
              </li>
              {session?.user && (
                <li>
                  <Link href="/profile" className="hover:text-gray-300">
                    Profile
                  </Link>
                </li>
              )}
              {session?.user && (
                <li>
                  <LogoutButton />
                </li>
              )}
              {!session?.user && (
                <>
                  <li>
                    <Link href="/signIn" className="hover:text-gray-300">Sign In</Link>
                  </li>
                  <li>
                    <Link href="/register" className="hover:text-gray-300">Register</Link>
                  </li>
                </>
              )}
              {session?.user?.image && (
                <li>
                  <Image
                    height={100}
                    width={100}
                    src={session?.user?.image}
                    alt="Profile"
                    className="w-10 h-10 rounded-full"
                  />
                </li>
              )}
            </ul>
          </div>
        </nav>
        <Provider>
          <main>{children}</main>
        </Provider>
      </body>
    </html>
  );
}
