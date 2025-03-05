import { useState, useEffect, Fragment } from "react";
import { supabase } from "../lib/supabaseClient";
import { Dialog, Transition } from '@headlessui/react';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

// Définir un type pour l'utilisateur
type UserType = {
  id: string;
  email?: string;  // Autoriser `email` à être optionnel
  username: string;
};


const Home = () => {
  const [user, setUser] = useState<UserType | null>(null);
  const [dueDates, setDueDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [statusList, setStatusList] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [participants, setParticipants] = useState<any[]>([]);
  const [creditMensualite, setCreditMensualite] = useState<string>("0.00");
  const [userEcheance, setUserEcheance] = useState<string>("0.00");
  const [popupOpen, setPopupOpen] = useState<boolean>(false);
  const [loaderVisible, setLoaderVisible] = useState<boolean>(false);
  const [popupMessage, setPopupMessage] = useState<string>("");
  const [mathResult, setMathResult] = useState<string>("");
  const [equation, setEquation] = useState<{ question: string; answer: number }>({
    question: "",
    answer: 0,
  });
  const [isValidating, setIsValidating] = useState(false);
  const [validationStatus, setValidationStatus] = useState<'success' | 'error' | null>(null);

  // Liste des mois en français
  const MONTHS = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
  ];

  useEffect(() => {
    const fetchUserAndCredits = async () => {
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
        const { data: userData, error: userTableError } = await supabase
          .from("users")
          .select("username")
          .eq("id", user.id)
          .single();

        if (userTableError) {
          console.error("Erreur lors de la récupération des informations utilisateur :", userTableError);
          setLoading(false);
          return;
        }

        setUser({ ...user, username: userData.username });

        // Requête pour récupérer les crédits avec le type `CreditDataType`
        const { data: creditData, error: creditError } = await supabase
        .from("credit_participants")
          .select("*, credits(*), users(username)")
          .eq("user_id", user.id);

      
      // Vérifier s'il y a des erreurs dans la récupération des données
      if (creditError) {
        console.error("Erreur lors de la récupération des crédits :", creditError);
      } else {
        // Vérification de la structure de creditData
        if (creditData && creditData.length > 0 && creditData[0]?.credits?.monthly_payment !== undefined) {
          const mensualite = creditData[0].credits.monthly_payment.toFixed(2) || "0.00";
          setCreditMensualite(mensualite);
        } else {
          setCreditMensualite("0.00"); // Par défaut si pas de mensualité
        }
      }
      

        // Requête pour récupérer les paiements
        const { data: paymentsData, error } = await supabase
          .from("payments")
          .select("month, year, is_paid, amount")
          .eq("user_id", user.id);

        if (error) {
          console.error("Erreur lors de la récupération des dates d'échéance :", error);
        } else {
          const uniqueDates = [
            ...new Set(
              paymentsData.map((item) => `${item.month}/${item.year}`)
            ),
          ].sort((a, b) => {
            const [monthA, yearA] = a.split("/").map(Number);
            const [monthB, yearB] = b.split("/").map(Number);
            return yearA - yearB || monthA - monthB;
          });

          setDueDates(uniqueDates);

          const statuses = uniqueDates.map((date) => {
            const [month, year] = date.split("/").map(Number);
            const matched = paymentsData.find(
              (item) => item.month === month && item.year === year
            );
            return {
              date,
              status: matched?.is_paid ? "Payé" : "Non payé",
              amount: matched?.amount || 0,
            };
          });

          setStatusList(statuses);

          const currentDate = new Date();
          const defaultDate = `${currentDate.getMonth() + 1}/${currentDate.getFullYear()}`;
          if (uniqueDates.includes(defaultDate)) {
            setSelectedDate(defaultDate);
          }
        }
      }

      setLoading(false);
    };

    fetchUserAndCredits();
  }, []);

  useEffect(() => {
    const fetchParticipantsAndUserEcheance = async () => {
      if (!selectedDate) return;

      const [month, year] = selectedDate.split("/").map(Number);

      const { data: participantsData, error } = await supabase
        .from("payments")
        .select("user_id, amount, is_paid, users(username)")
        .eq("month", month)
        .eq("year", year);

      if (error) {
        console.error("Erreur lors de la récupération des participants :", error);
      } else {
        setParticipants(participantsData || []);

        const userPayment = participantsData?.find(
          (payment) => payment.user_id === user?.id
        );
        setUserEcheance(userPayment?.amount?.toFixed(2) || "0.00");
      }
    };

    fetchParticipantsAndUserEcheance();
  }, [selectedDate, user?.id]);

  const calculateProgress = () => {
    const total = participants.length;
    const paidCount = participants.filter((p) => p.is_paid).length;
    return total === 0 ? 0 : (paidCount / total) * 100;
  };

  const calculateTotalPaid = () => {
    return participants
      .filter((p) => p.is_paid)
      .reduce((sum, p) => sum + p.amount, 0)
      .toFixed(2);
  };

  const formatSelectedDate = () => {
    if (!selectedDate) return "";
    const [month, year] = selectedDate.split("/").map(Number);
    return `${MONTHS[month - 1]} ${year}`;
  };

  const handlePayClick = () => {
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    setEquation({ question: `${num1} + ${num2}`, answer: num1 + num2 });
    setPopupOpen(true);
  };

  const handleConfirmPayment = async () => {
    setIsValidating(true);

    if (parseInt(mathResult) !== equation.answer) {
      setValidationStatus('error');
      setTimeout(() => {
        setValidationStatus(null);
        setIsValidating(false);
        setPopupMessage("Erreur : Le résultat est incorrect. Veuillez réessayer.");
      }, 1500);
      return;
    }

    setValidationStatus('success');
    setTimeout(async () => {
      setPopupOpen(false);
      setIsValidating(false);
      setValidationStatus(null);

      const [month, year] = selectedDate.split("/").map(Number);
      const { error } = await supabase
        .from("payments")
        .update({ is_paid: true })
        .eq("user_id", user?.id)
        .eq("month", month)
        .eq("year", year);

      if (error) {
        setPopupMessage("Erreur système : Le paiement n'a pas été confirmé.");
      } else {
        setPopupMessage("✅ Paiement confirmé avec succès !");
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    }, 1500);
  };

  const isPaid = statusList.find((status) => status.date === selectedDate)?.status === "Payé";

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Header avec dégradé */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-2 py-2 sm:px-2 lg:px-2">
          <div className="flex justify-between items-center">
            <div>
              {user && (
                <p className="text-blue-100 mt-1">
                  Bonjour, <span className="font-medium">{user.username}</span>
                </p>
              )}
            </div>
            <div className="text-right text-white">
              <p className="text-sm opacity-75">
                {new Date().toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-2 sm:px-2 lg:px-2 py-2">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : user ? (
          <div className="space-y-2">
            {/* Carte principale */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-2">
                {/* Sélecteur de date */}
                <div className="max-w-md mb-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Période de paiement
                  </label>
                  <div className="relative">
                    <select
                      className="appearance-none w-full bg-white border border-gray-300 rounded-lg py-3 px-4 pr-8 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                    >
                      <option value="">Sélectionnez une échéance</option>
                      {dueDates.map((date, index) => {
                        const [month, year] = date.split("/");
                        return (
                          <option key={index} value={date}>
                            {MONTHS[parseInt(month) - 1]} {year}
                          </option>
                        );
                      })}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </div>

                {selectedDate && (
                  <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Carte Mensualité */}
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-2 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-blue-900">Mensualité</h3>
                        <div className="p-2 bg-blue-200 rounded-full">
                          <svg className="w-4 h-4 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      </div>
                      <p className="text-2xl font-bold text-blue-900">{creditMensualite} €</p>
                      <p className="text-sm text-blue-700 mt-1">Échéance mensuelle</p>
                    </div>

                    {/* Carte Échéancier */}
                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-2 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-green-900">Mon échéancier</h3>
                        <div className="p-2 bg-green-200 rounded-full">
                          <svg className="w-4 h-4 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                        </div>
                      </div>
                      <p className="text-2xl font-bold text-green-900">{userEcheance} €</p>
                      <p className="text-sm text-green-700 mt-1">Montant personnel</p>
                    </div>

                    {/* Carte Progression */}
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-2 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-purple-900">Progression</h3>
                        <div className="p-2 bg-purple-200 rounded-full">
                          <svg className="w-4 h-4 text-purple-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                          </svg>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <div className="relative w-20 h-20">
                          <svg className="w-full h-full" viewBox="0 0 36 36">
                            <circle
                              className="text-purple-200"
                              strokeWidth="3"
                              stroke="currentColor"
                              fill="transparent"
                              r="16"
                              cx="18"
                              cy="18"
                            />
                            <circle
                              className="text-purple-500"
                              strokeWidth="3"
                              strokeDasharray={`${calculateProgress()}, 100`}
                              strokeLinecap="round"
                              stroke="currentColor"
                              fill="transparent"
                              r="16"
                              cx="18"
                              cy="18"
                              transform="rotate(-90 18 18)"
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-sm font-semibold text-purple-900">
                              {Math.round(calculateProgress())}%
                            </span>
                          </div>
                        </div>
                        <div className="ml-2">
                          <p className="text-sm text-purple-900">
                            {participants.filter(p => p.is_paid).length}/{participants.length} payés
                          </p>
                          <p className="text-xs text-purple-700 mt-1">
                            Total: {calculateTotalPaid()} €
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tableau des participants */}
                {selectedDate && (
                  <div className="mt-2">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                      <div className="px-2 py-2 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900">Liste des participants</h3>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Montant</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {participants.map((participant, index) => (
                              <tr key={index} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {participant.users.username}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {participant.amount.toFixed(2)} €
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                    participant.is_paid
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-red-100 text-red-800'
                                  }`}>
                                    {participant.is_paid ? "Payé" : "Non payé"}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* Bouton de paiement */}
                {selectedDate && !isPaid && (
                  <div className="mt-2 flex justify-center">
                    <button
                      onClick={handlePayClick}
                      className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-sm transition-colors duration-200"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      Effectuer le paiement
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Non connecté</h3>
            <p className="mt-1 text-sm text-gray-500">
              Veuillez vous connecter pour accéder à votre espace personnel.
            </p>
          </div>
        )}

        {/* Popup de paiement amélioré */}
        <Transition appear show={popupOpen} as={Fragment}>
          <Dialog as="div" className="relative z-50" onClose={() => setPopupOpen(false)}>
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-black bg-opacity-25" />
            </Transition.Child>

            <div className="fixed inset-0 overflow-y-auto">
              <div className="flex min-h-full items-center justify-center p-4">
                <Transition.Child
                  as={Fragment}
                  enter="ease-out duration-300"
                  enterFrom="opacity-0 scale-95"
                  enterTo="opacity-100 scale-100"
                  leave="ease-in duration-200"
                  leaveFrom="opacity-100 scale-100"
                  leaveTo="opacity-0 scale-95"
                >
                  <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                    <Dialog.Title
                      as="h3"
                      className="text-lg font-medium leading-6 text-gray-900 mb-4"
                    >
                      Confirmation du paiement
                    </Dialog.Title>
                    
                    {isValidating ? (
                      <div className="flex flex-col items-center justify-center py-6">
                        {validationStatus === null && (
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
                        )}
                        
                        {validationStatus === 'success' && (
                          <div className="animate-scale-up">
                            <CheckCircleIcon className="h-16 w-16 text-green-500" />
                          </div>
                        )}
                        
                        {validationStatus === 'error' && (
                          <div className="animate-shake">
                            <XCircleIcon className="h-16 w-16 text-red-500" />
                          </div>
                        )}
                      </div>
                    ) : (
                      <>
                        <div className="mt-2">
                          <p className="text-sm text-gray-500 mb-4">
                            Pour confirmer votre paiement, veuillez résoudre cette opération :
                          </p>
                          <div className="p-4 bg-blue-50 rounded-lg mb-4">
                            <p className="text-xl font-semibold text-center text-blue-900">
                              {equation.question} = ?
                            </p>
                          </div>
                          <input
                            type="number"
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            value={mathResult}
                            onChange={(e) => setMathResult(e.target.value)}
                            placeholder="Votre réponse"
                          />
                        </div>

                        <div className="mt-4 flex justify-end space-x-3">
                          <button
                            type="button"
                            className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            onClick={() => setPopupOpen(false)}
                          >
                            Annuler
                          </button>
                          <button
                            type="button"
                            className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            onClick={handleConfirmPayment}
                          >
                            Confirmer
                          </button>
                        </div>
                      </>
                    )}
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </Dialog>
        </Transition>

        {/* Message de confirmation */}
        {popupMessage && (
          <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 max-w-md border-l-4 border-blue-500">
            <p className="text-sm text-gray-700">{popupMessage}</p>
          </div>
        )}
      </main>
    </div>
  );
};

Home.protected = true;

export default Home;
