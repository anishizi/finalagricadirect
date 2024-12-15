import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

// Définition du type pour les données de crédit
type CreditType = {
  id: string;
  credits: {
    start_date: string;
    duration_months: number;
    total_due: number;
    amount: number;
    monthly_payment: number;
  };
};

const Credit = () => {
  // Définition de l'état avec le type explicite pour credits
  const [credits, setCredits] = useState<CreditType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchUserCredits = async () => {
      setLoading(true);
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.error("Erreur lors de la récupération de l'utilisateur connecté :", userError);
        setLoading(false);
        return;
      }

      if (user) {
        const { data, error } = await supabase
          .from("credit_participants")
          .select("*, credits(*), users(username)")
          .eq("user_id", user.id);

        if (error) {
          console.error("Erreur lors de la récupération des crédits :", error);
        } else {
          setCredits(data); // Ici le type de `data` doit correspondre à `CreditType[]`
        }
      }
      setLoading(false);
    };

    fetchUserCredits();
  }, []);

  const calculateRemainingAndPaid = (credit: CreditType) => {
    const startDate = new Date(credit.credits.start_date);
    const currentDate = new Date();
  
    // Si la date actuelle est avant la date de début, aucun paiement n'est dû
    if (currentDate < startDate) {
      return { monthsPaid: 0, amountPaid: 0, remainingAmount: credit.credits.total_due, remainingMonths: credit.credits.duration_months };
    }
  
    // Calcule les mois écoulés depuis la date de début (en considérant le jour de début)
    const diffInMonths =
      currentDate.getFullYear() * 12 +
      currentDate.getMonth() -
      (startDate.getFullYear() * 12 + startDate.getMonth());
  
    const elapsedMonths = Math.max(diffInMonths, 0); // S'assure qu'il n'y a pas de valeur négative
    const monthsPaid = Math.min(elapsedMonths, credit.credits.duration_months); // Limite aux mensualités totales
    const amountPaid = monthsPaid * credit.credits.monthly_payment; // Montant payé jusqu'à présent
    const remainingAmount = Math.max(credit.credits.total_due - amountPaid, 0); // Montant restant
    const remainingMonths = Math.max(credit.credits.duration_months - monthsPaid, 0); // Mensualités restantes
  
    return { monthsPaid, amountPaid, remainingAmount, remainingMonths };
  };
  

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-50 p-2">
      <h1 className="text-3xl font-bold text-gray-800 mb-4">Vos Crédits</h1>
      {loading ? (
        <p className="text-gray-600">Chargement...</p>
      ) : credits.length === 0 ? (
        <p className="text-gray-600">Aucun crédit trouvé.</p>
      ) : (
        <div className="w-full max-w-4xl space-y-6">
          {credits.map((credit) => {
            const { monthsPaid, amountPaid, remainingAmount, remainingMonths } = calculateRemainingAndPaid(credit);

            return (
              <div key={credit.id} className="mb-2 border border-gray-300 rounded-md bg-white p-2">
                <div className="mb-6">
                  <div className="flex justify-between">
                    <div className="text-sm text-gray-600">
                      <div className="flex flex-col items-start">
                        <span className="font-medium">Début du crédit</span>
                        <span>{new Date(credit.credits.start_date).toLocaleDateString('fr-FR')}</span>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">
                      <div className="flex flex-col items-end">
                        <span className="font-medium">Fin du crédit</span>
                        <span>{new Date(new Date(credit.credits.start_date).setMonth(new Date(credit.credits.start_date).getMonth() + credit.credits.duration_months)).toLocaleDateString('fr-FR')}</span>
                      </div>
                    </div>
                  </div>
                  <div className="relative w-full h-6 bg-gray-200 rounded-full overflow-hidden my-2">
                    <div
                      className="absolute top-0 left-0 h-full bg-blue-500 flex items-center justify-center text-white font-bold"
                      style={{ width: `${(monthsPaid / credit.credits.duration_months) * 100}%` }}
                    >
                      ✓
                    </div>
                    <div
                      className="absolute top-0 right-0 h-full bg-blue-300"
                      style={{ width: `${(remainingMonths / credit.credits.duration_months) * 100}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between mt-2">
                    <div className="flex items-center">
                      <span className="text-4xl font-bold text-blue-500 mr-2">{monthsPaid}</span>
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-800">mensualités</span>
                        <span className="text-xs text-gray-800">remboursées</span>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <span className="text-4xl font-bold text-blue-500 mr-2">{remainingMonths}</span>
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-800">mensualités</span>
                        <span className="text-xs text-gray-800">restantes</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <div className="flex justify-between">
                    <div className="text-sm text-gray-600">
                      <div className="flex flex-col items-start">
                        <span className="font-medium">Montant</span>
                        <span>{credit.credits.amount.toFixed(2)} €</span>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">
                      <div className="flex flex-col items-end">
                        <span className="font-medium">Montant Total (Dû):</span>
                        <span>{credit.credits.total_due.toFixed(2)} €</span>
                      </div>
                    </div>
                  </div>
                  <div className="relative w-full h-6 bg-gray-200 rounded-full overflow-hidden my-2">
                    <div
                      className="absolute top-0 left-0 h-full bg-green-500 flex items-center justify-center text-white font-bold"
                      style={{ width: `${(amountPaid / credit.credits.total_due) * 100}%` }}
                    >
                      ✓
                    </div>
                    <div
                      className="absolute top-0 right-0 h-full bg-green-300"
                      style={{ width: `${(remainingAmount / credit.credits.total_due) * 100}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between mt-2">
                    <div className="flex flex-col items-center">
                      <span className="text-2xl font-bold text-green-600">{amountPaid.toFixed(2)}€</span>
                      <span className="text-xs text-gray-800">somme remboursée</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-2xl font-bold text-green-600">{remainingAmount.toFixed(2)}€</span>
                      <span className="text-xs text-gray-800">somme restante</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div className="flex flex-col">
                    <span className="font-semibold">Mensualité:</span>
                    <span className="text-2xl font-bold text-blue-500">{credit.credits.monthly_payment.toFixed(2)} €</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

Credit.protected = true; // Cette page nécessite une authentification

export default Credit;
