import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

import type { NextRequest } from 'next/server';

// Routes that require authentication (admin or kitchen login)
const protectedRoutes = ['/dashboard', '/kitchen'];

export async function middleware (req: NextRequest) {
	const { pathname } = req.nextUrl;

	// --- Route Protection ---
	const isProtected = protectedRoutes.some((route) => pathname.startsWith(route));

	if (isProtected) {
		const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

		if (!token) {
			const loginUrl = new URL('/', req.url);
			return NextResponse.redirect(loginUrl);
		}
	}

	// --- Security Headers ---
	const response = NextResponse.next();

	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('X-Frame-Options', 'DENY');
	response.headers.set('X-XSS-Protection', '1; mode=block');
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
	response.headers.set(
		'Strict-Transport-Security',
		'max-age=63072000; includeSubDomains; preload',
	);

	return response;
}

export const config = {
	matcher: [
		/*
		 * Match all paths except:
		 * - _next/static (static files)
		 * - _next/image (image optimization)
		 * - favicon.ico
		 * - public assets
		 */
		'/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
	],
};
