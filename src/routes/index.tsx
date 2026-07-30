import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "../lib/auth-context";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.navigate({ to: "/gestao" });
      } else {
        router.navigate({ to: "/login" });
      }
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#faf8f3' }}>
      <div className="text-center">
        <div className="w-12 h-12 rounded-full agro-gradient animate-pulse mx-auto" />
        <p className="mt-4 text-gray-500">Carregando...</p>
      </div>
    </div>
  );
}
