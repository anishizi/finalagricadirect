import { useState, useEffect } from "react";
import AddCredit from "../components/AddCredit";
import { supabase } from "../lib/supabaseClient";

// Définir le type pour un crédit
type Credit = {
  id: string;
  amount: number;
  duration_months: number;
  credit_participants: {
    users: {
      username: string;
    };
  }[];
};

const GestionCredit = () => {
  const [showAddCredit, setShowAddCredit] = useState(false);
  // Utiliser le type `Credit[]` pour spécifier que `credits` est un tableau de crédits
  const [credits, setCredits] = useState<Credit[]>([]);

  useEffect(() => {
    const fetchCredits = async () => {
      const { data, error } = await supabase
        .from("credits")
        .select("*, credit_participants(user_id, users(username))");

      if (error) {
        console.error(error);
      } else {
        setCredits(data);
      }
    };

    fetchCredits();
  }, []);

  const handleAddCredit = () => setShowAddCredit(true);
  const handleCancel = () => setShowAddCredit(false);

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-50 p-2 w-full">
      {!showAddCredit ? (
        <div className="w-full">
          <button
            onClick={handleAddCredit}
            className="px-4 py-2 bg-blue-500 text-white rounded shadow hover:bg-blue-600 transition duration-200 w-full max-w-lg mb-4"
          >
            Ajouter Crédit
          </button>

          <div className="overflow-x-auto w-full">
            <table className="min-w-full bg-white rounded shadow-md">
              <thead>
                <tr>
                  <th className="px-4 py-2 border">Montant</th>
                  <th className="px-4 py-2 border">Durée</th>
                  <th className="px-4 py-2 border">Participants</th>
                </tr>
              </thead>
              <tbody>
                {credits.map((credit) => (
                  <tr key={credit.id}>
                    <td className="px-4 py-2 border">{credit.amount} €</td>
                    <td className="px-4 py-2 border">{credit.duration_months} mois</td>
                    <td className="px-4 py-2 border">
                      {credit.credit_participants
                        .map((p) => p.users.username)
                        .join(", ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="w-full">
          <AddCredit onCancel={handleCancel} />
        </div>
      )}
    </div>
  );
};

// Marquer cette page comme protégée
GestionCredit.protected = true;

export default GestionCredit;
