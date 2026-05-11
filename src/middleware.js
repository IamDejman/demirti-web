import { withAxiom } from 'next-axiom';

export default withAxiom();

export const config = {
  matcher: [
    // Match all paths except static files and _next internals
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
