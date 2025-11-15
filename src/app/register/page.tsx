"use client";
import LogoutButton from '@/app/components/LogoutButton';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function RegisterPage() {
  const { data: session } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error');
      // Auto login credenciales
      const loginResult = await signIn('credentials', {
        redirect: false,
        email,
        password,
        callbackUrl: '/dashboard'
      });
      if (loginResult?.ok) {
        router.push('/dashboard');
      } else {
        router.push('/signIn');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (session?.user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white text-gray-800 dark:bg-zinc-900 dark:text-zinc-100 p-8 rounded-lg shadow w-[420px] space-y-4 text-center">
          <h1 className="text-xl font-semibold">Ya estás autenticado</h1>
          <p className="text-sm opacity-80">Puedes cerrar sesión para registrar otra cuenta.</p>
          <div className="flex justify-center"><LogoutButton /></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white text-gray-800 dark:text-zinc-100 p-8 rounded-lg shadow w-[420px]">
        <h1 className="text-2xl font-bold mb-4 text-center text-black">Registro</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border rounded px-3 py-2 bg-white text-gray-800"
            required
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            className="border rounded px-3 py-2 bg-white text-gray-800"
            required
          />
          <button disabled={loading} type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition">
            {loading ? 'Registrando...' : 'Registrarse'}
          </button>
          {error && <p className="text-red-600 text-sm">{error}</p>}
        </form>
      </div>
    </div>
  );
}
