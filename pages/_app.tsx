import "../styles/globals.css";
import type { AppProps } from "next/app";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";
import Meta from "../components/Meta";
import BottomNavbar from "../components/BottomNavbar";

type CustomAppProps = AppProps & {
  Component: {
    protected?: boolean; // Indique si la page nécessite une authentification
  };
};

const MyApp = ({ Component, pageProps }: CustomAppProps) => {
  const [loading, setLoading] = useState(true); // État de chargement
  const router = useRouter();

  // Liste des pages publiques (non protégées)
  const publicPages = ["/auth/login", "/auth/register", "/auth/not-approved"];
  const isPublicPage = publicPages.includes(router.pathname);

  useEffect(() => {
    const checkAuth = async () => {
      // Si la page n'est pas protégée, on autorise l'accès
      if (!Component.protected) {
        setLoading(false);
        return;
      }

      try {
        const { data: { user }, error } = await supabase.auth.getUser();

        // Si l'utilisateur n'est pas connecté
        if (error || !user) {
          console.log("Utilisateur non connecté, redirection vers login.");
          router.push("/auth/login");
          return;
        }

        // Vérifie si l'utilisateur est approuvé dans la table `users`
        const { data, error: userError } = await supabase
          .from("users")
          .select("is_approved")
          .eq("id", user.id)
          .single();

        if (userError || !data?.is_approved) {
          console.log("Utilisateur non approuvé, redirection.");
          router.push("/auth/not-approved");
          return;
        }

        // Tout est validé, autoriser l'accès
        setLoading(false);
      } catch (err) {
        console.error("Erreur inattendue :", err);
        router.push("/auth/login");
      }
    };

    checkAuth();
  }, [Component.protected, router]);

  // Affiche un écran de chargement pendant la vérification
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Chargement...</p>
      </div>
    );
  }

  return (
    <>
      <Meta />
      <div className={!isPublicPage ? "pb-16" : ""}>
        <Component {...pageProps} />
      </div>
      {!isPublicPage && <BottomNavbar />}
    </>
  );
};

export default MyApp;
