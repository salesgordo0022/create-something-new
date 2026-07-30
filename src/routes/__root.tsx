import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Toaster } from "sonner";
import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AuthProvider } from "../lib/auth-context";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Diagnóstico Tributário do Agronegócio" },
      { name: "description", content: "Sistema de Diagnóstico Tributário para Produtores Rurais" },
      { name: "author", content: "Contabilidade Agro" },
      { property: "og:title", content: "Diagnóstico Tributário do Agronegócio" },
      { property: "og:description", content: "Sistema de Diagnóstico Tributário para Produtores Rurais" },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: () => (
    <div className="flex min-h-screen items-center justify-center px-4" style={{ background: '#faf8f3' }}>
      <div className="max-w-md text-center">
        <div className="text-8xl font-bold" style={{ color: '#1a5c2a' }}>404</div>
        <h2 className="mt-4 text-xl font-semibold text-gray-800">Página não encontrada</h2>
        <p className="mt-2 text-sm text-gray-500">A página que você procura não existe ou foi movida.</p>
        <a href="/" className="agro-button-primary mt-6">Voltar ao início</a>
      </div>
    </div>
  ),
  errorComponent: ({ error, reset }) => {
    console.error(error);
    const router = useRouter();
    useEffect(() => { reportLovableError(error, { boundary: "root" }); }, [error]);
    return (
      <div className="flex min-h-screen items-center justify-center px-4" style={{ background: '#faf8f3' }}>
        <div className="max-w-md text-center">
          <h1 className="text-xl font-semibold text-gray-800">Algo deu errado</h1>
          <p className="mt-2 text-sm text-gray-500">Ocorreu um erro inesperado. Tente novamente.</p>
          <div className="mt-6 flex gap-2 justify-center">
            <button onClick={() => { router.invalidate(); reset(); }} className="agro-button-primary">Tentar novamente</button>
            <a href="/" className="agro-button bg-white border border-gray-300 text-gray-700 hover:bg-gray-50">Voltar</a>
          </div>
        </div>
      </div>
    );
  },
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Outlet />
        <Toaster position="top-right" richColors />
      </AuthProvider>
    </QueryClientProvider>
  );
}
