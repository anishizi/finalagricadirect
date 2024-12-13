import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

const Capital = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [capitals, setCapitals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Charger les données des projets avec leurs coûts estimés et dépenses totales
  const fetchProjects = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("projects")
      .select("id, title, estimated_cost, expenses(total)");

    if (error) {
      console.error("Erreur lors de la récupération des projets :", error);
    } else {
      const formattedProjects = data.map((project: any) => {
        const totalExpenses = project.expenses.reduce(
          (sum: number, expense: any) => sum + expense.total,
          0
        );
        return {
          id: project.id,
          title: project.title,
          estimatedCost: project.estimated_cost,
          totalExpenses,
        };
      });
      setProjects(formattedProjects);
    }
    setLoading(false);
  };

  // Charger les données des capitaux
  const fetchCapitals = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("capitals")
      .select("created_at, source, amount");

    if (error) {
      console.error("Erreur lors de la récupération des capitaux :", error);
    } else {
      const formattedCapitals = data.map((capital: any) => {
        return {
          date: new Date(capital.created_at).toLocaleDateString("fr-FR"),
          source: capital.source,
          amount: capital.amount,
        };
      });
      setCapitals(formattedCapitals);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProjects();
    fetchCapitals();
  }, []);

  const calculateTotals = () => {
    const totalExpenses = projects.reduce((sum, project) => sum + project.totalExpenses, 0);
    const totalCapital = capitals.reduce((sum, capital) => sum + capital.amount, 0);
    const remainingCapital = totalCapital - totalExpenses;

    return {
      totalExpenses,
      totalCapital,
      remainingCapital,
    };
  };

  const { totalExpenses, totalCapital, remainingCapital } = calculateTotals();

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-50 px-2">
      <h2 className="text-lg font-bold text-gray-800 mb-2">Liste des Capitaux</h2>

      {loading ? (
        <p className="text-gray-500">Chargement des données...</p>
      ) : capitals.length === 0 ? (
        <p className="text-gray-500">Aucun capital trouvé.</p>
      ) : (
        <div className="w-full max-w-4xl bg-white p-2 rounded-md shadow-md overflow-x-auto border border-black mb-2">
          <table className="w-full table-auto text-sm border-collapse border border-gray-300 rounded-md">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-2 py-1 border text-left">Date</th>
                <th className="px-2 py-1 border text-left">Source</th>
                <th className="px-2 py-1 border text-right">Somme TND</th>
              </tr>
            </thead>
            <tbody>
              {capitals.map((capital, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-2 py-1 border">{capital.date}</td>
                  <td className="px-2 py-1 border truncate max-w-[200px]">{capital.source}</td>
                  <td className="px-2 py-1 border text-right">
                    {capital.amount.toLocaleString("fr-FR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="w-full max-w-4xl bg-white p-2 rounded-md shadow-md overflow-x-auto border border-black">
        <table className="w-full table-auto text-sm border-collapse border border-gray-300 rounded-md">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-2 py-1 border text-left">Total des Dépenses</th>
              <th className="px-2 py-1 border text-left">Total du Capital</th>
              <th className="px-2 py-1 border text-left">Reste du Capital</th>
            </tr>
          </thead>
          <tbody>
            <tr className="hover:bg-gray-50">
              <td className="px-2 py-1 border text-right">
                {totalExpenses.toLocaleString("fr-FR")}
              </td>
              <td className="px-2 py-1 border text-right">
                {totalCapital.toLocaleString("fr-FR")}
              </td>
              <td
                className={`px-2 py-1 border text-right font-bold ${
                  remainingCapital >= 0 ? "text-green-500" : "text-red-500"
                }`}
              >
                {remainingCapital.toLocaleString("fr-FR")}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2 className="text-lg font-bold text-gray-800 mb-2">Liste des Projets</h2>

      {loading ? (
        <p className="text-gray-500">Chargement des données...</p>
      ) : projects.length === 0 ? (
        <p className="text-gray-500">Aucun projet trouvé.</p>
      ) : (
        <div className="w-full max-w-4xl bg-white p-2 rounded-md shadow-md overflow-x-auto border border-black mb-2">
          <table className="w-full table-auto text-sm border-collapse border border-gray-300 rounded-md">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-2 py-1 border truncate w-1/2">Nom du Projet</th>
                <th className="px-2 py-1 border text-right w-1/4">Coût Estimé</th>
                <th className="px-2 py-1 border text-right w-1/4">Dépenses Totales</th>
                <th className="px-2 py-1 border text-right w-1/4">Final</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => {
                const remaining = project.estimatedCost - project.totalExpenses;
                return (
                  <tr key={project.id} className="hover:bg-gray-50">
                    <td className="px-2 py-1 border truncate max-w-[100px]">{project.title}</td>
                    <td className="px-2 py-1 border text-right whitespace-nowrap">
                      {project.estimatedCost?.toLocaleString("fr-FR") || "-"}
                    </td>
                    <td className="px-2 py-1 border text-right whitespace-nowrap">
                      {project.totalExpenses.toLocaleString("fr-FR")}
                    </td>
                    <td
                      className={`px-2 py-1 border text-right whitespace-nowrap font-bold ${
                        remaining >= 0 ? "text-green-500" : "text-red-500"
                      }`}
                    >
                      {remaining.toLocaleString("fr-FR")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// Marquer cette page comme protégée
Capital.protected = true;

export default Capital;
