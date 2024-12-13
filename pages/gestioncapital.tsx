import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import AddCapital from "../components/AddCapital"; // Importer le composant AddCapital
import NotificationPopup from "../components/NotificationPopup"; // Importer un popup de notification
import { FiTrash2 } from "react-icons/fi"; // Icône de suppression

const GestionCapital = () => {
  const [capitals, setCapitals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingCapital, setIsAddingCapital] = useState(false); // État pour ajouter un capital
  const [notification, setNotification] = useState({
    message: "",
    type: "info" as "success" | "error" | "info",
    isVisible: false,
  });
  const [isConfirmDelete, setIsConfirmDelete] = useState(false); // État pour afficher le popup de confirmation
  const [capitalToDelete, setCapitalToDelete] = useState<any>(null); // Capital à supprimer
  const [num1, setNum1] = useState<number>(0); // Premier nombre de l'équation
  const [num2, setNum2] = useState<number>(0); // Deuxième nombre de l'équation
  const [userAnswer, setUserAnswer] = useState<string>(""); // Réponse de l'utilisateur

  // Charger les données de capital
  const fetchCapitals = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("capitals").select("*").order("created_at", { ascending: false });
    if (error) {
      console.error("Erreur lors de la récupération des données de capital :", error);
    } else {
      setCapitals(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCapitals();
  }, []);

  // Gestion de la soumission réussie
  const handleConfirmAddCapital = async () => {
    setIsAddingCapital(false); // Fermer le composant AddCapital
    setNotification({
      message: "Capital ajouté avec succès !",
      type: "success",
      isVisible: true,
    });
    await fetchCapitals(); // Rafraîchir les données
  };

  // Gestion des erreurs
  const handleError = (errorMessage: string) => {
    setNotification({
      message: errorMessage,
      type: "error",
      isVisible: true,
    });
  };

  // Afficher le popup de confirmation pour supprimer un capital
  const handleDeleteClick = (capital: any) => {
    setCapitalToDelete(capital);
    const number1 = Math.floor(Math.random() * 10) + 1;
    const number2 = Math.floor(Math.random() * 10) + 1;
    setNum1(number1);
    setNum2(number2);
    setIsConfirmDelete(true);
  };

  // Confirmer la suppression après validation
  const handleConfirmDelete = async () => {
    const correctAnswer = num1 + num2;
    if (parseInt(userAnswer, 10) !== correctAnswer) {
      setNotification({
        message: "Résultat incorrect. Suppression annulée.",
        type: "error",
        isVisible: true,
      });
      return;
    }

    const { error } = await supabase.from("capitals").delete().eq("id", capitalToDelete.id);

    if (error) {
      setNotification({
        message: "Erreur lors de la suppression du capital.",
        type: "error",
        isVisible: true,
      });
    } else {
      setNotification({
        message: "Capital supprimé avec succès !",
        type: "success",
        isVisible: true,
      });
      await fetchCapitals(); // Rafraîchir les données
    }

    setIsConfirmDelete(false); // Fermer le popup
    setUserAnswer(""); // Réinitialiser la réponse utilisateur
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-50 px-4">
      {/* Bouton Ajouter Capital */}
      {!isAddingCapital ? (
        <div className="w-full flex justify-between items-center mb-4">
          <h1 className="text-lg font-medium text-gray-800">Gestion Capital</h1>
          <button
            onClick={() => setIsAddingCapital(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Ajouter Capital
          </button>
        </div>
      ) : null}

      {/* Afficher AddCapital ou la liste */}
      {isAddingCapital ? (
        <AddCapital
          onCancel={() => setIsAddingCapital(false)} // Revenir à la page gestion capital
          onConfirm={handleConfirmAddCapital} // Rafraîchir les données et afficher la notification
        />
      ) : loading ? (
        <p className="text-center text-gray-500">Chargement des données...</p>
      ) : capitals.length === 0 ? (
        <p>Aucun capital enregistré.</p>
      ) : (
        <table className="table-auto w-full bg-white border border-gray-300 rounded shadow">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 border">ID</th>
              <th className="px-4 py-2 border">Somme</th>
              <th className="px-4 py-2 border">Source</th>
              <th className="px-4 py-2 border">Date</th>
              <th className="px-4 py-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {capitals.map((capital) => (
              <tr key={capital.id} className="text-center">
                <td className="px-4 py-2 border">{capital.id}</td>
                <td className="px-4 py-2 border">{capital.amount.toLocaleString("fr-FR")} TND</td>
                <td className="px-4 py-2 border">{capital.source}</td>
                <td className="px-4 py-2 border">
                  {new Date(capital.created_at).toLocaleDateString("fr-FR")}
                </td>
                <td className="px-4 py-2 border">
                  <FiTrash2
                    className="text-red-500 cursor-pointer hover:text-red-700"
                    onClick={() => handleDeleteClick(capital)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Popup de confirmation pour suppression */}
      {isConfirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-md shadow-md max-w-lg w-full">
            <p className="text-lg font-medium text-center mb-4">
              Confirmez la suppression en résolvant l'équation suivante :
            </p>
            <p className="text-center text-xl font-semibold">
              {num1} + {num2} = ?
            </p>
            <input
              type="number"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              className="mt-4 p-2 border rounded-md w-full text-center"
              placeholder="Votre réponse"
            />
            <div className="flex justify-end gap-4 mt-6">
              <button
                onClick={() => {
                  setIsConfirmDelete(false);
                  setUserAnswer("");
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Popup */}
      {notification.isVisible && (
        <NotificationPopup
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification({ ...notification, isVisible: false })} isVisible={false} action={""} onAction={function (action: string): void {
            throw new Error("Function not implemented.");
          } }        />
      )}
    </div>
  );
};

export default GestionCapital;
