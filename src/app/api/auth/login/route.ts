import { NextResponse } from 'next/server';
import { SignJWT } from 'jose';

const JWT_SECRET = new TextEncoder().encode('super_secure_vault_secret_key_123');

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (email === 'admin@securevault.com' && password === 'admin123') {
      const token = await new SignJWT({ userId: 'admin_usr_123' })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('2h')
        .sign(JWT_SECRET);

      const response = NextResponse.json({ success: true });
      response.cookies.set('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
      });
      return response;
    }
    
    return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
  } catch(e) {
    return NextResponse.json({ success: false, error: 'Login failed' }, { status: 500 });
  }
}
