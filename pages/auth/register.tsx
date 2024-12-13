import { useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useRouter } from "next/router";
import bcrypt from "bcryptjs"; // Optionnel, uniquement si vous gérez les mots de passe hashés

const Register = () => {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleRegister = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      setIsSubmitting(false);
      return;
    }

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setIsSubmitting(false);
      return;
    }

    const { user } = authData;

    if (user) {
      // Hasher le mot de passe uniquement si vous utilisez une colonne `password` dans la table `users`
      const hashedPassword = bcrypt.hashSync(password, 10); // Optionnel
      const { error: insertError } = await supabase.from("users").insert({
        id: user.id,
        email: user.email,
        username,
        password: hashedPassword, // Supprimez cette ligne si vous ne stockez pas les mots de passe ici
        is_approved: false,
      });

      if (insertError) {
        setError(insertError.message);
        setIsSubmitting(false);
        return;
      }

      alert("Compte créé avec succès !");
      router.push("/auth/login");
    }

    setTimeout(() => {
      setIsSubmitting(false);
    }, 5000);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Créer un compte</h1>
      <div className="w-full max-w-sm">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-2 mb-4 border border-gray-300 rounded focus:outline-none focus:ring focus:ring-blue-200"
        />
        <input
          type="text"
          placeholder="Nom d'utilisateur"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full px-4 py-2 mb-4 border border-gray-300 rounded focus:outline-none focus:ring focus:ring-blue-200"
        />
        <input
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-2 mb-4 border border-gray-300 rounded focus:outline-none focus:ring focus:ring-blue-200"
        />
        <input
          type="password"
          placeholder="Confirmer le mot de passe"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full px-4 py-2 mb-4 border border-gray-300 rounded focus:outline-none focus:ring focus:ring-blue-200"
        />
        <button
          onClick={handleRegister}
          disabled={isSubmitting}
          className={`w-full bg-blue-500 text-white font-bold py-2 rounded ${
            isSubmitting ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-600"
          } transition`}
        >
          {isSubmitting ? "Veuillez patienter..." : "S'inscrire"}
        </button>
        {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
        <p className="text-sm text-gray-600 mt-4 text-center">
          Déjà un compte ?{" "}
          <span
            onClick={() => router.push("/auth/login")}
            className="text-blue-500 hover:underline cursor-pointer"
          >
            Connectez-vous ici
          </span>
        </p>
      </div>
    </div>
  );
};

export default Register;
