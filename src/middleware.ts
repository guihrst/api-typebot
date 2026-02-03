import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse, NextRequest } from 'next/server'

// Rotas do cliente (não devem passar pelo Clerk)
const clienteRoutes = ['/cliente', '/api/cliente']

export default function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname
  
  // Se for rota do cliente, ignora completamente o Clerk
  if (clienteRoutes.some(route => path.startsWith(route))) {
    return NextResponse.next()
  }
  
  // Para outras rotas, usa o Clerk
  return clerkMiddleware(async (auth, req) => {
    const isProtectedRoute = createRouteMatcher(['/list(.*)'])
    const { userId, redirectToSignIn } = await auth()
    if (!userId && isProtectedRoute(req)) {
      return redirectToSignIn({ returnBackUrl: req.url })
    }
  })(req, {} as any)
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
