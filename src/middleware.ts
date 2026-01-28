import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

// Rotas protegidas pelo Clerk (admin)
const isProtectedRoute = createRouteMatcher(['/list(.*)'])

// Rotas do cliente (não devem passar pelo Clerk)
const isClienteRoute = createRouteMatcher(['/cliente(.*)', '/api/cliente(.*)'])

export default clerkMiddleware(async (auth, req) => {
  // Ignorar rotas do cliente - elas têm autenticação própria
  if (isClienteRoute(req)) {
    return NextResponse.next()
  }

  const { userId, redirectToSignIn } = await auth()

  if (!userId && isProtectedRoute(req)) {
    return redirectToSignIn({ returnBackUrl: req.url })
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
