"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/Alert";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { authenticate, ApiError } from "@/lib/api";
import { setToken } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("manager");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await authenticate(username.trim(), password);
      setToken(response.accessToken);
      router.push("/dashboard");
    } catch (requestError) {
      if (requestError instanceof ApiError) {
        if (requestError.status === 401) {
          setError("Usuário ou senha inválidos.");
        } else {
          setError(requestError.details?.detail ?? requestError.message);
        }
      } else {
        setError("Falha ao autenticar.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-md">
        <p className="text-xs uppercase tracking-[0.4em] text-white/50">DecorRental</p>
        <h1
          className="mt-4 text-3xl font-semibold text-white"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Acesso operacional
        </h1>
        <p className="mt-2 text-sm text-white/60">
          Entre com seu usuário para gerenciar kits, estoque e reservas.
        </p>

        <Card className="mt-8">
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <Input
              label="Usuário"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
            />
            <Input
              label="Senha"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
            />
            {error ? <Alert tone="error" message={error} /> : null}
            <Button type="submit" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </Card>
      </div>
    </main>
  );
}
