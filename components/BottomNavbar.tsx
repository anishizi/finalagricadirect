import { useRouter } from "next/router";
import { FiHome, FiCreditCard, FiFolder, FiDollarSign, FiPieChart, FiUser } from "react-icons/fi";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const BottomNavbar = () => {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [menuVisible, setMenuVisible] = useState(false); // État pour afficher ou masquer le menu

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData.user) {
        setLoading(false);
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
      setLoading(false);
    };

    fetchProfile();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  const navItems = [
    { label: "Home", icon: FiHome, route: "/" },
    { label: "Credit", icon: FiCreditCard, route: "/credit" },
    { label: "Project", icon: FiFolder, route: "/project" },
    { label: "Depense", icon: FiDollarSign, route: "/depense" },
    { label: "Capital", icon: FiPieChart, route: "/capital" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 z-50">
      <ul className="flex justify-around py-3">
        {navItems.map((item) => (
          <li
            key={item.label}
            className={`flex flex-col items-center cursor-pointer ${
              router.pathname === item.route ? "text-blue-500" : "text-gray-400"
            }`}
            onClick={() => router.push(item.route)}
          >
            <item.icon size={20} />
            <span className="text-xs">{item.label}</span>
          </li>
        ))}

        {/* Gestion dynamique du profil */}
        {loading ? (
          <li className="flex flex-col items-center text-gray-400">
            <FiUser size={20} />
            <span className="text-xs">Chargement</span>
          </li>
        ) : profile ? (
          profile.role === "admin" ? (
            <li
              className={`flex flex-col items-center cursor-pointer ${
                router.pathname === "/profile" ? "text-blue-500" : "text-gray-400"
              }`}
              onClick={() => router.push("/profile")}
            >
              <FiUser size={20} />
              <span className="text-xs">Admin</span>
            </li>
          ) : (
            <li className="relative">
              <div
                className="flex items-center justify-center w-8 h-8 bg-green-500 text-white font-bold text-sm rounded-full cursor-pointer"
                onClick={() => setMenuVisible(!menuVisible)}
              >
                {profile.username?.slice(0, 2).toUpperCase() || "NN"}
              </div>
              {menuVisible && (
                <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 bg-white shadow-md rounded-md p-2 z-40">
                  <button
                    onClick={handleLogout}
                    className="text-red-500 font-bold text-xs hover:underline"
                  >
                    Logout
                  </button>
                </div>
              )}
            </li>
          )
        ) : (
          <li className="flex flex-col items-center text-gray-400">
            <FiUser size={20} />
            <span className="text-xs">Inconnu</span>
          </li>
        )}
      </ul>
    </nav>
  );
};

export default BottomNavbar;
