import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

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
    if (parseInt(mathResult) !== equation.answer) {
      setPopupMessage("Erreur : Résultat incorrect.");
      return;
    }

    setPopupOpen(false);
    setLoaderVisible(true);

    const [month, year] = selectedDate.split("/").map(Number);
    const { error } = await supabase
      .from("payments")
      .update({ is_paid: true })
      .eq("user_id", user?.id)
      .eq("month", month)
      .eq("year", year);

    setLoaderVisible(false);

    if (error) {
      setPopupMessage("Erreur système : Le paiement n'a pas été confirmé.");
    } else {
      setPopupMessage("Paiement confirmé avec succès !");
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    }
  };

  const isPaid = statusList.find((status) => status.date === selectedDate)?.status === "Payé";

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-50 p-2">
      {loading ? (
        <p className="text-gray-600">Chargement...</p>
      ) : user ? (
        <div className="w-full max-w-md">
          <p className="text-gray-600 mb-2">Bonjour, {user.username}.</p>
          <label htmlFor="due-dates" className="block text-sm font-medium text-gray-700 mb-2">
            Sélectionnez une date d'échéance :
          </label>
          <select
            id="due-dates"
            className="w-full border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          >
            <option value="">-- Sélectionnez --</option>
            {dueDates.map((date, index) => (
              <option key={index} value={date}>
                {date}
              </option>
            ))}
          </select>

          {selectedDate && (
            <p className="text-gray-800 mt-2 text-xl">
              Date sélectionnée : <span className="font-medium">{formatSelectedDate()}</span>
            </p>
          )}

          {selectedDate && (
            <div className="mt-4">
              <div className="flex items-center space-x-6">
                <div className="w-24 h-24 relative">
                  <svg className="absolute top-0 left-0 w-full h-full" viewBox="0 0 36 36">
                    <circle
                      className="text-gray-300"
                      strokeWidth="4"
                      stroke="currentColor"
                      fill="transparent"
                      r="16"
                      cx="18"
                      cy="18"
                    />
                    <circle
                      className="text-green-500"
                      strokeWidth="4"
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
                  <div className="absolute inset-0 flex items-center justify-center text-sm font-semibold">
                    {participants.filter((p) => p.is_paid).length}/{participants.length}
                  </div>
                </div>
                <div className="flex flex-col">
                  <div>
                    <span className="font-semibold">Mensualité:</span>
                    <span className="text-xl font-bold text-blue-500 ml-2">{creditMensualite} €</span>
                  </div>
                  <div className="mt-2">
                    <span className="font-semibold">Mon échéancier:</span>
                    <span className="text-xl font-bold text-green-600 ml-2">{userEcheance} €</span>
                  </div>
                  <div className="text-gray-600 mt-1">Total : {calculateTotalPaid()} €</div>
                </div>
              </div>

              {!isPaid && (
                <button
                  className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                  onClick={handlePayClick}
                >
                  Payer
                </button>
              )}

              {popupOpen && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                  <div className="bg-white p-6 rounded shadow-lg">
                    <p className="text-gray-800 mb-4">Résolvez : {equation.question}</p>
                    <input
                      type="text"
                      value={mathResult}
                      onChange={(e) => setMathResult(e.target.value)}
                      className="w-full border border-gray-300 rounded-md p-2 mb-4"
                    />
                    <div className="flex justify-end space-x-4">
                      <button
                        className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
                        onClick={() => setPopupOpen(false)}
                      >
                        Annuler
                      </button>
                      <button
                        className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                        onClick={handleConfirmPayment}
                      >
                        Confirmer
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {loaderVisible && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                  <div className="text-white text-xl">Chargement...</div>
                </div>
              )}

              {popupMessage && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                  <div className="bg-white p-6 rounded shadow-lg">
                    <p className="text-gray-800">{popupMessage}</p>
                    <button
                      className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                      onClick={() => setPopupMessage("")}
                    >
                      OK
                    </button>
                  </div>
                </div>
              )}
          <div className="w-full max-w-4xl bg-white p-2 rounded-md shadow-md overflow-x-auto border border-black mt-2">

          <table className="w-full table-fixed text-sm border-collapse border border-gray-300 rounded-md">
          <thead className="bg-gray-100">
                  <tr>
                    <th className="px-2 py-1 border">Nom</th>
                    <th className="px-2 py-1 border">Montant</th>
                    <th className="px-2 py-1 border">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {participants.map((participant, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-2 py-1 border">{participant.users.username}</td>
                      <td className="px-2 py-1 border">{participant.amount.toFixed(2)} €</td>
                      <td
                        className={`px-2 py-1 border font-semibold ${
                          participant.is_paid ? "text-green-500" : "text-red-500"
                        }`}
                      >
                        {participant.is_paid ? "Payé" : "Non payé"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </div>
          )}
        </div>
      ) : (
        <p className="text-gray-600">Aucun utilisateur connecté.</p>
      )}
    </div>
  );
};

Home.protected = true;

export default Home;
