import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import Loader from "./Loader";

const AddCapital = ({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) => {
  const [amount, setAmount] = useState<string>(""); // État pour la somme
  const [source, setSource] = useState<string>(""); // État pour la source
  const [isLoading, setIsLoading] = useState<boolean>(false); // État pour indiquer le chargement

  // Fonction pour formater la somme
  const formatAmount = (value: string) => {
    const numericValue = value.replace(/\D/g, ""); // Supprimer les caractères non numériques
    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, " "); // Ajouter des espaces tous les 3 chiffres
  };

  // Fonction pour gérer la soumission du formulaire
  const handleConfirm = async () => {
    if (!amount || !source) {
      alert("Veuillez remplir tous les champs.");
      return;
    }

    setIsLoading(true);

    const numericAmount = parseFloat(amount.replace(/\s/g, "")); // Convertir la somme en nombre
    const { error } = await supabase.from("capitals").insert([
      {
        amount: numericAmount,
        source,
      },
    ]);

    if (error) {
      console.error("Erreur lors de l'ajout du capital :", error);
      alert("Une erreur s'est produite lors de l'ajout du capital.");
    } else {
      alert("Capital ajouté avec succès !");
      onConfirm(); // Rafraîchir la liste des capitaux après ajout
    }

    setIsLoading(false);
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white p-4 rounded-md shadow-md">
      {isLoading ? (
        <Loader />
      ) : (
        <>
          <h2 className="text-lg font-bold text-center mb-4">Ajouter un Capital</h2>

          {/* Champ Somme */}
          <div className="mb-4">
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
              Somme (TND)
            </label>
            <input
              id="amount"
              type="text"
              inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(formatAmount(e.target.value))}
              placeholder="0 000 000"
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-300"
            />
          </div>

          {/* Champ Source */}
          <div className="mb-4">
            <label htmlFor="source" className="block text-sm font-medium text-gray-700 mb-2">
              Source
            </label>
            <input
              id="source"
              type="text"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="Source du capital"
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-300"
            />
          </div>

          {/* Boutons Annuler et Confirmer */}
          <div className="flex justify-end gap-2">
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
              disabled={isLoading}
            >
              Annuler
            </button>
            <button
              onClick={handleConfirm}
              className={`px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 ${
                isLoading ? "opacity-50 cursor-not-allowed" : ""
              }`}
              disabled={isLoading}
            >
              Confirmer
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default AddCapital;
