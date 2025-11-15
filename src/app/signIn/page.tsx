'use client';
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from 'react';
import { FaGithub, FaGoogle } from "react-icons/fa";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loadingCreds, setLoadingCreds] = useState(false);
    const [lockedRemaining, setLockedRemaining] = useState<number | null>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const handleGoogleSignIn = async () => {
        const result = await signIn("google", {
            callbackUrl: "/dashboard",
            redirect: false
        });
        if (result?.ok) router.push("/dashboard");
    };

    const handleGitHubSignIn = async () => {
        const result = await signIn("github", {
            callbackUrl: "/dashboard",
            redirect: false
        });
        if (result?.ok) router.push("/dashboard");
    };

    const handleCredentialsLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoadingCreds(true);
        const result = await signIn('credentials', {
            redirect: false,
            email,
            password,
            callbackUrl: '/dashboard'
        });
        setLoadingCreds(false);
        if (result?.ok) {
            router.push('/dashboard');
        } else {
            // Tras fallo consultar estado de bloqueo
            try {
                const res = await fetch('/api/lock-status', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email })
                });
                const data = await res.json();
                if (data.locked && typeof data.remainingMs === 'number') {
                    setLockedRemaining(data.remainingMs);
                    setError('Cuenta bloqueada por intentos fallidos');
                } else {
                    setError(result?.error || 'Credenciales inválidas');
                }
            } catch {
                setError(result?.error || 'Error de autenticación');
            }
        }
    };

    // Actualizar countdown cada segundo
    useEffect(() => {
        if (lockedRemaining !== null) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            intervalRef.current = setInterval(() => {
                setLockedRemaining(prev => {
                    if (prev === null) return null;
                    const next = prev - 1000;
                    if (next <= 0) {
                        clearInterval(intervalRef.current!);
                        return null;
                    }
                    return next;
                });
            }, 1000);
        }
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [lockedRemaining]);

    function formatRemaining(ms: number) {
        const totalSeconds = Math.ceil(ms / 1000);
        const m = Math.floor(totalSeconds / 60);
        const s = totalSeconds % 60;
        return `${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="bg-white p-8 rounded-lg shadow-md w-[420px] flex flex-col gap-4">
                <h1 className="text-2xl text-gray-800 font-bold mb-2 text-center">Sign In</h1>

                <form onSubmit={handleCredentialsLogin} className="flex flex-col gap-3">
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="border rounded px-3 py-2 bg-auto text-black "
                        required
                    />
                    <input
                        type="password"
                        placeholder="Contraseña"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="border rounded px-3 py-2 text-black"
                        required
                        minLength={6}
                    />
                    <button
                        disabled={loadingCreds}
                        type="submit"
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition"
                    >
                        {loadingCreds ? 'Ingresando...' : 'Ingresar'}
                    </button>
                    {error && <p className="text-red-600 text-sm">{error}{lockedRemaining !== null && (
                        <span className="ml-2 font-mono">Tiempo restante: {formatRemaining(lockedRemaining)}</span>
                    )}</p>}
                </form>

                <div className="flex flex-col gap-3 mt-2">
                    <button
                        onClick={handleGoogleSignIn}
                        className="w-full bg-gray-700 text-white py-2 px-4 rounded hover:bg-black transition flex items-center justify-center gap-2"
                    >
                        <FaGoogle /> Google
                    </button>
                    <button
                        onClick={handleGitHubSignIn}
                        className="w-full bg-gray-700 text-white py-2 px-4 rounded hover:bg-black transition flex items-center justify-center gap-2"
                    >
                        <FaGithub /> GitHub
                    </button>
                </div>

                <div className="text-center text-sm mt-2 text-black">
                    ¿No tienes cuenta?{' '}
                    <button
                        onClick={() => router.push('/register')}
                        className="text-blue-600 hover:underline"
                        type="button"
                    >
                        Regístrate
                    </button>
                </div>
            </div>
        </div>
    );
}