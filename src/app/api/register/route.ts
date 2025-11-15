import { createUser } from '@/lib/users';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { email, password } = data || {};
    if (!email || !password) {
      return NextResponse.json({ error: 'Email y password requeridos' }, { status: 400 });
    }
    const user = await createUser(email, password);
    return NextResponse.json({ user });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Error registro' }, { status: 400 });
  }
}
