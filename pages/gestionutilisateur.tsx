import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { useRouter } from "next/router";
import PasswordModal from "../components/PasswordModal";

const Gestionutilisateur = () => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPassword, setNewPassword] = useState<{ [key: string]: string }>({});
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
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

      if (profileError) {
        console.error("Erreur lors de la récupération du profil :", profileError);
      } else {
        setProfile(profileData);
      }

      if (profileData?.role === "admin") {
        const { data: usersData, error: usersError } = await supabase
          .from("users")
          .select("id, email, username, is_approved, role");

        if (usersError) {
          console.error("Erreur lors de la récupération des utilisateurs :", usersError);
        } else {
          setUsers(usersData);
        }
      }

      setUser(authData.user);
      setLoading(false);
    };

    fetchData();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  const updateUser = async (id: string, updates: Partial<{ is_approved: boolean; role: string }>) => {
    const { error } = await supabase.from("users").update(updates).eq("id", id);
    if (error) {
      console.error("Erreur lors de la mise à jour :", error);
    } else {
      setUsers(users.map(user => (user.id === id ? { ...user, ...updates } : user)));
      alert("Mise à jour réussie !");
    }
  };

  const handlePasswordUpdate = async (password: string) => {
    if (!selectedUser) return;
    
    await updateUserPassword(selectedUser.id, password);
    setSelectedUser(null); // Ferme le modal
  };

  const updateUserPassword = async (userId: string, password: string) => {
    try {
      const response = await fetch('/api/update-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la mise à jour du mot de passe');
      }

      alert('Mot de passe mis à jour avec succès');
    } catch (error: any) {
      console.error('Error:', error);
      alert(error.message || 'Erreur lors de la mise à jour du mot de passe');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Chargement...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-50">
      {profile?.role === "admin" && (
        <div className="bg-white shadow-md p-2 w-full max-w-4xl rounded-md mx-2 border border-black">
        <h2 className="text-sm font-bold text-gray-800 mb-2 text-center">Liste des utilisateurs</h2>
          {users.length === 0 ? (
            <p className="text-gray-500 text-center">Aucun utilisateur trouvé.</p>
          ) : (
            <table className="w-full table-fixed text-xs border-collapse border border-gray-300 rounded-md">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-2 py-1 border w-1/6 truncate">Nom</th>
                  <th className="px-2 py-1 border w-1/4 truncate">Email</th>
                  <th className="px-2 py-1 border w-1/6 text-center">Approuvé</th>
                  <th className="px-2 py-1 border w-1/6 text-center">Rôle</th>
                  <th className="px-2 py-1 border w-1/4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(userItem => (
                  <tr key={userItem.id} className="hover:bg-gray-50">
                    <td className="px-2 py-1 border truncate">{userItem.username || "Non défini"}</td>
                    <td className="px-2 py-1 border truncate">{userItem.email}</td>
                    <td className="px-2 py-1 border text-center">
                      {userItem.id === user.id ? (
                        <div>
                          <input
                            type="checkbox"
                            id={`approved-${userItem.id}`}
                            name={`approved-${userItem.id}`}
                            checked={userItem.is_approved}
                            disabled
                            className="cursor-not-allowed bg-gray-100"
                          />
                          <label htmlFor={`approved-${userItem.id}`} className="hidden">
                            Approuvé
                          </label>
                        </div>
                      ) : (
                        <div>
                          <input
                            type="checkbox"
                            id={`approved-${userItem.id}`}
                            name={`approved-${userItem.id}`}
                            checked={userItem.is_approved}
                            onChange={() =>
                              updateUser(userItem.id, { is_approved: !userItem.is_approved })
                            }
                          />
                          <label htmlFor={`approved-${userItem.id}`} className="hidden">
                            Approuvé
                          </label>
                        </div>
                      )}
                    </td>
                    <td className="px-2 py-1 border text-center">
                      <div className="relative inline-block w-full max-w-[120px]">
                        {userItem.id === user.id ? (
                          <div>
                            <select
                              id={`role-${userItem.id}`}
                              name={`role-${userItem.id}`}
                              disabled
                              className="cursor-not-allowed bg-gray-100 text-gray-400 px-2 py-1 w-full rounded"
                            >
                              <option value="admin">Admin</option>
                              <option value="user">Utilisateur</option>
                            </select>
                            <label htmlFor={`role-${userItem.id}`} className="hidden">
                              Rôle
                            </label>
                          </div>
                        ) : (
                          <div>
                            <select
                              id={`role-${userItem.id}`}
                              name={`role-${userItem.id}`}
                              value={userItem.role}
                              onChange={(e) =>
                                updateUser(userItem.id, { role: e.target.value })
                              }
                              className="bg-white px-2 py-1 w-full rounded border"
                            >
                              <option value="admin">Admin</option>
                              <option value="user">Utilisateur</option>
                            </select>
                            <label htmlFor={`role-${userItem.id}`} className="hidden">
                              Rôle
                            </label>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-1 border text-center">
                      <button
                        onClick={() => setSelectedUser(userItem)}
                        className="bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600"
                      >
                        Modifier MDP
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <PasswordModal
            isOpen={!!selectedUser}
            onClose={() => setSelectedUser(null)}
            username={selectedUser?.username || ''}
            onSubmit={handlePasswordUpdate}
          />
        </div>
      )}
    </div>
  );
};

Gestionutilisateur.protected = true;

export default Gestionutilisateur;
