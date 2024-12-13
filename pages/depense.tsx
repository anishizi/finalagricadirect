
  import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { FiInfo, FiImage } from "react-icons/fi"; // Icônes pour fichiers
import NotificationPopup from "../components/NotificationPopup";
import AddExpenses from "../components/AddExpenses"; // Importer le composant d'ajout
import ViewImagePopup from "@/components/ViewImagePopup";

const Depense = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAddingExpense, setIsAddingExpense] = useState(false); // État pour ajouter une dépense

  // Charger les projets avec le total des dépenses
  const fetchProjects = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("projects")
      .select(`
        id,
        title,
        expenses(total)
      `);

    if (error) {
      console.error("Erreur lors de la récupération des projets :", error);
    } else {
      const projectsWithTotal = data.map((project) => {
        const totalExpenses = project.expenses.reduce((sum, expense) => sum + expense.total, 0);
        return {
          id: project.id,
          title: project.title,
          total: totalExpenses.toLocaleString("fr-FR"), // Formater le total des dépenses
        };
      });
      setProjects(projectsWithTotal);
    }
    setLoading(false);
  };

  // Charger les dépenses d'un projet spécifique
  const fetchExpenses = async (projectId: number) => {
    setLoading(true);
    const { data, error } = await supabase
      .from("expenses")
      .select("description, unit_price, quantity, total, file_url")
      .eq("project_id", projectId);

    if (error) {
      console.error("Erreur lors de la récupération des dépenses :", error);
    } else {
      setExpenses(
        data.map((expense) => ({
          description: expense.description,
          unit_price: expense.unit_price.toLocaleString("fr-FR"),
          quantity: expense.quantity,
          total: expense.total.toLocaleString("fr-FR"),
          file_url: expense.file_url || null,
        }))
      );
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProjects(); // Charger les projets au démarrage
  }, []);

  // Afficher les détails des dépenses pour un projet
  const handleViewDetails = (project: any) => {
    setSelectedProject(project);
    fetchExpenses(project.id);
  };

  // Retourner à la liste des projets
  const handleBack = () => {
    setSelectedProject(null);
    setExpenses([]);
  };

  // Afficher une image dans un popup
  const handleViewFile = (fileUrl: string) => {
    setSelectedFile(fileUrl);
  };

  // Fermer le popup du fichier
  const handleCloseFilePopup = () => {
    setSelectedFile(null);
  };

  // Annuler l'ajout d'une dépense
  const handleCancelAddExpense = () => {
    setIsAddingExpense(false);
  };

  // Rafraîchir après ajout de dépense
  const handleRefresh = async () => {
    setIsAddingExpense(false);
    await fetchProjects();
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-50 p-2 ">
      {/* Mode Ajout Dépense */}
      {isAddingExpense ? (
        <AddExpenses onCancel={handleCancelAddExpense} onRefresh={handleRefresh} />
      ) : selectedProject ? (
        /* Mode Détails des Dépenses */
        <div className="flex justify-center w-full min-h-screen">
        <div className="w-full max-w-4xl">
          {/* Description au-dessus */}
          <div className="mb-2">
            <h2 className="text-xl font-bold mb-2 text-center">
              Détails des Dépenses - {selectedProject.title}
            </h2>
            
          </div>
      
          <div className="bg-white p-2 rounded-md shadow-md overflow-x-auto border border-black">
  <table className="w-full table-auto text-sm border-collapse border border-gray-300 rounded-md">
    <thead className="bg-gray-100">
      <tr>
        {/* Colonne File*/}
        <th className="ppx-2 py-1 border w-1/14 truncate">F</th>
        {/* Colonne Description */}
        <th className="ppx-2 py-1 border w-1/2 truncate">Description</th>

        {/* Colonne Prix Unitaire */}
        <th className="px-2 py-1 border text-right text-xs sm:w-1/4">PU</th>

        {/* Colonne Quantité */}
        <th className="px-2 py-1 border text-right text-xs sm:w-1/4">Qt</th>

        {/* Colonne Total */}
        <th className="px-2 py-1 border text-right text-xs sm:w-1/4">Total</th>
      </tr>
    </thead>
    <tbody>
      {expenses.length === 0 ? (
        <tr>
          <td colSpan={4} className="text-center py-4">
            Aucune dépense trouvée.
          </td>
        </tr>
      ) : (
        expenses.map((expense, index) => (
          <tr key={index} className="hover:bg-gray-50">
            {/* Colonne Icône */}
  <td className="px-2 py-1 border text-center">
    {expense.file_url && (
      <FiImage
        className="text-green-500 cursor-pointer hover:text-green-700"
        onClick={() => handleViewFile(expense.file_url)}
      />
    )}
  </td>
            {/* Description */}
            <td className="px-2 py-1 border truncate max-w-[100px]">
              
              {expense.description || "Description non disponible"}
            </td>

            {/* Prix Unitaire */}
            <td className="px-2 py-1 border text-right whitespace-nowrap">
              {expense.unit_price}
            </td>

            {/* Quantité */}
            <td className="px-2 py-1 border text-right whitespace-nowrap">
              {expense.quantity}
            </td>

            {/* Total */}
            <td className="px-2 py-1 border text-right whitespace-nowrap">
              {expense.total}
            </td>
          </tr>
        ))
      )}
    </tbody>
  </table>
</div>


      
          {/* Bouton Retour en bas */}
          <div className="mt-4 text-center">
            <button
              onClick={handleBack}
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
            >
              Retour
            </button>
          </div>
        </div>
      </div>
      
      ) : (
        /* Mode Liste des Projets */
        <div className="flex flex-col items-center w-full min-h-screen">
          {/* En-tête de la page */}
          <h2 className="text-xl font-bold mb-2 text-center">
              Détails des Dépenses Project
            </h2>
          
          {/* Tableau des projets */}
          <div className="w-full max-w-4xl bg-white p-2 rounded-md shadow-md overflow-x-auto border border-black">
  {loading ? (
    <p className="text-center text-gray-500">Chargement...</p>
  ) : (
    <table className="w-full table-fixed text-sm border-collapse border border-gray-300 rounded-md">
      <thead className="bg-gray-100">
        <tr>
          <th className="px-2 py-1 border w-1/2 truncate">Nom du Projet</th>
          <th className="px-2 py-1 border w-1/4 text-center">Total</th>
          <th className="px-2 py-1 border w-1/4 text-center">Actions</th>
        </tr>
      </thead>
      <tbody>
        {projects.length === 0 ? (
          <tr>
            <td colSpan={3} className="text-center py-4">
              Aucun projet trouvé.
            </td>
          </tr>
        ) : (
          projects.map((project) => (
            <tr key={project.id} className="hover:bg-gray-50">
              <td className="px-2 py-1 border truncate max-w-[100px]">
                {project.title}
              </td>
              <td className="px-2 py-1 border text-right">{project.total}</td>
              <td className="px-2 py-1 border text-center">
                <button
                  onClick={() => handleViewDetails(project)}
                  className="text-blue-500 hover:text-blue-700 flex items-center gap-1"
                >
                  <FiInfo /> Info
                </button>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  )}
</div>

        </div>
      )}
  
      {/* Popup pour afficher une image */}
      {selectedFile && (
        <ViewImagePopup selectedFile={selectedFile} handleCloseFilePopup={handleCloseFilePopup} />
      )}
    </div>
  );
  
};

Depense.protected = true;
  
  export default Depense;
