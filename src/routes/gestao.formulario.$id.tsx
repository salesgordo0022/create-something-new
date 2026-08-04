import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "../lib/auth-context";
import { FormularioFixo } from "../components/form/formulario-fixo";

export const Route = createFileRoute("/gestao/formulario/$id")({
  component: GestaoFormularioPage,
});

function GestaoFormularioPage() {
  const { id } = Route.useParams();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.navigate({ to: "/login" });
    }
  }, [authLoading, user, router]);

  if (authLoading || !user) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "#f2efe8" }}
      >
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl agro-gradient animate-pulse mx-auto" />
          <p className="mt-4 text-sm font-medium tracking-wide text-gray-400">Carregando...</p>
        </div>
      </div>
    );
  }

  return <FormularioFixo formularioId={id} />;
}
