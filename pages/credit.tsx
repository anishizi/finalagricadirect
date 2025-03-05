import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { FiClock, FiCalendar, FiDollarSign, FiTrendingUp, FiPieChart } from 'react-icons/fi';

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
    
    // Calculer le nombre de mois écoulés, y compris le mois en cours
    const elapsedMonths = Math.floor(
      (currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44)
    );
  
    // Toujours ajouter 1 pour inclure le mois en cours
    const monthsPaid = Math.min(elapsedMonths + 1, credit.credits.duration_months);
  
    // Calculer le montant payé en incluant le mois en cours
    const amountPaid = monthsPaid * credit.credits.monthly_payment;
    const remainingAmount = credit.credits.total_due - amountPaid;
    const remainingMonths = Math.max(0, credit.credits.duration_months - monthsPaid);
  
    return {
      monthsPaid,
      amountPaid,
      remainingAmount,
      remainingMonths,
      progressPercentage: (monthsPaid / credit.credits.duration_months) * 100
    };
  };

  const calculateStatistics = (credit: CreditType) => {
    const { monthsPaid, amountPaid, remainingAmount } = calculateRemainingAndPaid(credit);
    const totalInterest = credit.credits.total_due - credit.credits.amount;
    const monthlyInterest = totalInterest / credit.credits.duration_months;
    const interestPaid = monthlyInterest * monthsPaid;
    const remainingInterest = totalInterest - interestPaid;

    return {
      totalInterest,
      monthlyInterest,
      interestPaid,
      remainingInterest,
      principalPaid: amountPaid - interestPaid,
      remainingPrincipal: remainingAmount - remainingInterest,
    };
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* En-tête de la page */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-semibold text-gray-900">Tableau de bord des crédits</h1>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : credits.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <h3 className="text-lg font-medium text-gray-900">Aucun crédit actif</h3>
            <p className="mt-2 text-sm text-gray-500">Vous n'avez pas encore de crédit en cours.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Grille des crédits */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {credits.map((credit) => {
                const { monthsPaid, amountPaid, remainingAmount, remainingMonths } = calculateRemainingAndPaid(credit);
                const stats = calculateStatistics(credit);
                
                return (
                  <div key={credit.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    {/* En-tête du crédit */}
                    <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700">
                      <div className="flex justify-between items-center text-white">
                        <h2 className="text-lg font-semibold">Crédit {credit.credits.amount.toLocaleString('fr-FR')} €</h2>
                        <FiTrendingUp className="h-6 w-6" />
                      </div>
                    </div>

                    {/* Corps de la carte */}
                    <div className="p-6">
                      {/* Progression */}
                      <div className="mb-6">
                        <div className="flex justify-between text-sm text-gray-600 mb-2">
                          <span>Progression</span>
                          <span className="font-medium">
                            {Math.round((monthsPaid / credit.credits.duration_months) * 100)}%
                          </span>
                        </div>
                        <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="absolute top-0 left-0 h-full bg-blue-500 transition-all duration-500"
                            style={{ width: `${(monthsPaid / credit.credits.duration_months) * 100}%` }}
                          />
                        </div>
                      </div>

                      {/* Informations principales */}
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-500">Mensualité</span>
                          <span className="text-lg font-semibold text-gray-900">
                            {credit.credits.monthly_payment.toLocaleString('fr-FR')} €
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-500">Reste à payer</span>
                          <span className="text-lg font-semibold text-gray-900">
                            {remainingAmount.toLocaleString('fr-FR')} €
                          </span>
                        </div>
                      </div>

                      {/* Nouvelles statistiques détaillées */}
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="col-span-2">
                          <h3 className="text-sm font-medium text-gray-900 mb-3">Répartition du crédit</h3>
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-xs text-gray-500">Capital initial</p>
                                <p className="text-sm font-semibold">{credit.credits.amount.toLocaleString('fr-FR')} €</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Intérêts totaux</p>
                                <p className="text-sm font-semibold">{stats.totalInterest.toLocaleString('fr-FR')} €</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Capital remboursé</p>
                                <p className="text-sm font-semibold text-green-600">{stats.principalPaid.toLocaleString('fr-FR')} €</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Intérêts payés</p>
                                <p className="text-sm font-semibold text-orange-600">{stats.interestPaid.toLocaleString('fr-FR')} €</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Dates et durée */}
                      <div className="border-t pt-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex items-start">
                            <FiCalendar className="h-4 w-4 text-gray-400 mr-2 mt-1" />
                            <div className="flex flex-col">
                              <span className="text-xs text-gray-500">Échéance</span>
                              <span className="text-sm font-medium">
                                {new Date(credit.credits.start_date).toLocaleDateString('fr-FR')}
                              </span>
                              <span className="text-xs text-gray-400">Fin : {
                                new Date(new Date(credit.credits.start_date).setMonth(
                                  new Date(credit.credits.start_date).getMonth() + credit.credits.duration_months
                                )).toLocaleDateString('fr-FR')
                              }</span>
                            </div>
                          </div>
                          <div className="flex items-start">
                            <FiClock className="h-4 w-4 text-gray-400 mr-2 mt-1" />
                            <div className="flex flex-col">
                              <span className="text-xs text-gray-500">Reste</span>
                              <span className="text-sm font-medium">{remainingMonths} mois</span>
                              <span className="text-xs text-gray-400">sur {credit.credits.duration_months} mois</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Supprimez toute la section suivante */}
                      {/* Graphique d'évolution */}
                      {/* <div className="mt-6 pt-6 border-t"> ... </div> */}

                    </div>

                    {/* Pied de carte */}
                    <div className="px-6 py-4 bg-gray-50 border-t">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">Total remboursé</span>
                        <span className="text-sm font-semibold text-green-600">
                          {amountPaid.toLocaleString('fr-FR')} €
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

Credit.protected = true; // Cette page nécessite une authentification

export default Credit;
