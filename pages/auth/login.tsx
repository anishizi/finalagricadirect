import { useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useRouter } from "next/router";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    } else {
      router.push("/");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Connexion</h1>
      <div className="w-full max-w-sm">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-2 mb-4 border border-gray-300 rounded focus:outline-none focus:ring focus:ring-blue-200"
        />
        <input
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-2 mb-4 border border-gray-300 rounded focus:outline-none focus:ring focus:ring-blue-200"
        />
        <button
          onClick={handleLogin}
          className="w-full bg-blue-500 text-white font-bold py-2 rounded hover:bg-blue-600 transition"
        >
          Se connecter
        </button>
        {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
        <p className="text-sm text-gray-600 mt-4 text-center">
          Pas encore de compte ?{" "}
          <span
            onClick={() => router.push("/auth/register")}
            className="text-blue-500 hover:underline cursor-pointer"
          >
            Inscrivez-vous ici
          </span>
        </p>
      </div>
    </div>
  );
};

export default Login;
