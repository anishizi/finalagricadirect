import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { useRouter } from "next/router";
import { FiCreditCard, FiUsers, FiFolder, FiDollarSign, FiTrendingUp } from "react-icons/fi";
import GestionCredit from "./gestioncredit";
import GestionUtilisateur from "./gestionutilisateur";
import GestionProject from "./gestionproject";
import GestionDepenses from "./gestiondepenses";
import GestionCapital from "./gestioncapital"; // Importer le nouveau composant

const Profile = () => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activePage, setActivePage] = useState<string>(""); // État pour la page active
  const router = useRouter();

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData.user) {
        router.push("/auth/login");
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from("users")
        .select("username, role")
        .eq("id", authData.user.id)
        .single();

      if (!profileError) {
        setProfile(profileData);
      }
      setUser(authData.user);
      setLoading(false);
    };

    fetchProfile();
  }, [router]);

  const renderPage = () => {
    switch (activePage) {
      case "credit":
        return <GestionCredit />;
      case "utilisateur":
        return <GestionUtilisateur />;
      case "project":
        return <GestionProject />;
      case "depenses":
        return <GestionDepenses />;
      case "capital":
        return <GestionCapital />; // Ajouter Gestion Capital
      default:
        return null;
    }
  };

  // Fonction pour déconnecter l'utilisateur
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login"); // Redirige vers la page de connexion
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Chargement...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-50 px-2">
      {!activePage ? (
        <>
          {/* Page principale du Profile */}
          <div className="w-full max-w-sm">
            <h1 className="text-lg font-medium text-gray-800 text-center mb-2">
              Gestion des données
            </h1>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setActivePage("credit")}
                className="flex flex-col items-center justify-center bg-blue-100 text-blue-600 border border-gray-300 py-2 rounded-lg shadow hover:bg-blue-200 transition"
              >
                <FiCreditCard size={32} />
                <span className="text-sm mt-2">Gestion Crédit</span>
              </button>
              <button
                onClick={() => setActivePage("utilisateur")}
                className="flex flex-col items-center justify-center bg-green-100 text-green-600 border border-gray-300 py-4 rounded-lg shadow hover:bg-green-200 transition"
              >
                <FiUsers size={32} />
                <span className="text-sm mt-2">Gestion Utilisateur</span>
              </button>
              <button
                onClick={() => setActivePage("project")}
                className="flex flex-col items-center justify-center bg-yellow-100 text-yellow-600 border border-gray-300 py-4 rounded-lg shadow hover:bg-yellow-200 transition"
              >
                <FiFolder size={32} />
                <span className="text-sm mt-2">Gestion Projets</span>
              </button>
              <button
                onClick={() => setActivePage("depenses")}
                className="flex flex-col items-center justify-center bg-red-100 text-red-600 border border-gray-300 py-4 rounded-lg shadow hover:bg-red-200 transition"
              >
                <FiDollarSign size={32} />
                <span className="text-sm mt-2">Gestion Dépenses</span>
              </button>
              <button
                onClick={() => setActivePage("capital")}
                className="flex flex-col items-center justify-center bg-purple-100 text-purple-600 border border-gray-300 py-4 rounded-lg shadow hover:bg-purple-200 transition"
              >
                <FiTrendingUp size={32} />
                <span className="text-sm mt-2">Gestion Capital</span>
              </button>
            </div>
          </div>

          {/* Bouton Déconnexion visible uniquement sur la page principale */}
          <button
            onClick={handleLogout}
            className="mt-8 bg-red-500 text-white font-bold py-2 px-6 rounded hover:bg-red-600 text-sm"
          >
            Déconnexion
          </button>
        </>
      ) : (
        <div className="w-full">
          {/* Pages secondaires */}
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-medium text-gray-800">
              {activePage === "credit"
                ? "Gestion Crédit"
                : activePage === "utilisateur"
                ? "Gestion Utilisateur"
                : activePage === "project"
                ? "Gestion Projets"
                : activePage === "depenses"
                ? "Gestion Dépenses"
                : "Gestion Capital"}
            </h2>
            <button
              onClick={() => setActivePage("")}
              className="text-sm text-blue-500 hover:underline"
            >
              Retour
            </button>
          </div>
          {renderPage()}
        </div>
      )}
    </div>
  );
};

Profile.protected = true;

export default Profile;
