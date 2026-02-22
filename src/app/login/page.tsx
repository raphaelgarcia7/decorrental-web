"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authenticate, ApiError } from "@/lib/api";
import { setToken } from "@/lib/auth";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { Alert } from "@/components/Alert";

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
      const result = await authenticate(username.trim(), password);
      setToken(result.accessToken);
      router.push("/dashboard");
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          setError("Usuário ou senha inválidos.");
        } else {
          setError(err.details?.detail ?? err.message);
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
          Acesso Operacional
        </h1>
        <p className="mt-2 text-sm text-white/60">
          Entre com seu usuario para gerenciar kits e reservas.
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
