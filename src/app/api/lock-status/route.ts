import { getLockStatusByEmail } from '@/lib/users';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: 'Email requerido' }, { status: 400 });
    const status = getLockStatusByEmail(email);
    return NextResponse.json(status);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Error' }, { status: 500 });
  }
}
