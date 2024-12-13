import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { FiInfo, FiImage, FiEdit, FiTrash2 } from "react-icons/fi"; // Icônes pour fichiers
import NotificationPopup from "../components/NotificationPopup";
import AddExpenses from "../components/AddExpenses"; // Importer le composant d'ajout
import ModifyExpense from "../components/ModifyExpense"; // Composant pour modifier une dépense
import ConfirmPopup from "../components/ConfirmPopup"; // Composant pour confirmation de suppression
import ViewImagePopup from "@/components/ViewImagePopup";

const GestionDepenses = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAddingExpense, setIsAddingExpense] = useState(false); // État pour ajouter une dépense
  const [isModifyingExpense, setIsModifyingExpense] = useState(false);
  const [expenseToModify, setExpenseToModify] = useState<any>(null);
  const [isConfirmDelete, setIsConfirmDelete] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<any>(null);
  const [isConfirmCreateAnother, setIsConfirmCreateAnother] = useState(false); // Confirmation pour créer une autre dépense
  const [zoom, setZoom] = useState(1);

  const handleZoom = (e: React.WheelEvent) => {
    if (e.deltaY < 0) {
      setZoom((prevZoom) => Math.min(prevZoom + 0.1, 3));  // Limiter le zoom à 3x
    } else {
      setZoom((prevZoom) => Math.max(prevZoom - 0.1, 1));  // Limiter le zoom à 1x
    }
  };
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
      .select("id, description, unit_price, quantity, total, file_url")
      .eq("project_id", projectId);

    if (error) {
      console.error("Erreur lors de la récupération des dépenses :", error);
    } else {
      setExpenses(data || []);
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

  // Ajouter une nouvelle dépense et afficher la confirmation pour créer une autre dépense
  const handleAddExpense = () => {
    setIsAddingExpense(true);
  };

  // Supprimer une dépense et son fichier sur Cloudinary
  const handleDeleteExpense = async () => {
    if (!expenseToDelete) return;

    // Supprimer le fichier de Cloudinary si un fichier est attaché
    if (expenseToDelete.file_url) {
      const publicId = expenseToDelete.file_url.split("/").pop()?.split(".")[0]; // Extraire le public_id à partir de l'URL
      if (publicId) {
        await deleteFileFromCloudinary(publicId); // Supprimer le fichier de Cloudinary
      }
    }

    // Supprimer la dépense de Supabase
    const { error } = await supabase.from("expenses").delete().eq("id", expenseToDelete.id);
    if (error) {
      console.error("Erreur lors de la suppression de la dépense:", error);
    }

    setIsConfirmDelete(false);
    fetchExpenses(selectedProject.id); // Rafraîchir la liste des dépenses
  };

  // Supprimer un fichier de Cloudinary
  const deleteFileFromCloudinary = async (publicId: string) => {
    try {
      const response = await fetch("/api/deleteFile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ public_id: publicId }),
      });

      const data = await response.json();
      if (response.ok) {
        console.log("Fichier supprimé de Cloudinary");
      } else {
        console.error("Erreur de suppression du fichier de Cloudinary :", data.error);
      }
    } catch (error) {
      console.error("Erreur de suppression du fichier de Cloudinary :", error);
    }
  };

  // Modifier une dépense
  const handleModifyExpense = (expense: any) => {
    setExpenseToModify(expense);
    setIsModifyingExpense(true);
  };

  // Fermer le popup de création de dépense
  // Annuler la création d'une autre dépense



  // Rafraîchir après ajout de dépense
 // Rafraîchir après ajout de dépense
const handleRefresh = async () => {
  if (selectedProject) {
    await fetchExpenses(selectedProject.id); // Rafraîchir les dépenses pour le projet sélectionné
  }
  await fetchProjects(); // Rafraîchir la liste des projets
  setIsAddingExpense(false);
};


  

  // Fonction pour gérer la création d'une autre dépense
  const handleCreateAnotherExpense = () => {
    setIsAddingExpense(true);
    setIsConfirmCreateAnother(false); // Fermer la popup de confirmation
  };

  // Annuler la création d'une autre dépense
  const handleCancelCreateAnother = () => {
    setIsConfirmCreateAnother(false);
    setIsAddingExpense(false); // Revenir à la gestion des dépenses
  };
// Définir handleViewFile pour afficher l'image sélectionnée dans un modal
const handleViewFile = (fileUrl: string) => {
  setSelectedFile(fileUrl); // Enregistrer l'URL du fichier sélectionné
};

// Ajouter une fonction pour fermer le popup d'image
const handleCloseFilePopup = () => {
  setSelectedFile(null); // Réinitialiser l'état pour fermer le popup
};

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-50 pt-0">
      {/* Mode Ajout Dépense */}
      {isAddingExpense ? (
        <AddExpenses
        onCancel={() => setIsAddingExpense(false)} // Ferme le popup
        onRefresh={handleRefresh} // Passe handleRefresh pour recharger les données
      />
      
      ) : isModifyingExpense ? (
        <ModifyExpense
  expense={expenseToModify}
  onCancel={() => setIsModifyingExpense(false)}
  onRefresh={handleRefresh} // Passe handleRefresh pour recharger les données après modification
/>
      ) : selectedProject ? (
        /* Mode Détails des Dépenses */
        <div className="flex justify-center w-full min-h-screen">
          <div className="w-full max-w-4xl">
            <div className="mb-2">
              <h2 className="text-xl font-bold mb-2 text-center">
                Détails des Dépenses - {selectedProject.title}
              </h2>
            </div>

            <div className="bg-white p-2 rounded-md shadow-md overflow-x-auto border border-black">
              <table className="w-full table-auto text-sm border-collapse border border-gray-300 rounded-md">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="ppx-2 py-1 border w-1/14 truncate">F</th>
                    <th className="ppx-2 py-1 border w-1/2 truncate">Description</th>
                    <th className="px-2 py-1 border text-right text-xs sm:w-1/4">PU</th>
                    <th className="px-2 py-1 border text-right text-xs sm:w-1/4">Qt</th>
                    <th className="px-2 py-1 border text-right text-xs sm:w-1/4">Total</th>
                    <th className="px-2 py-1 border text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-4">
                        Aucune dépense trouvée.
                      </td>
                    </tr>
                  ) : (
                    expenses.map((expense) => (
                      <tr key={expense.id} className="hover:bg-gray-50">
  <td className="px-2 py-1 border text-center">
    {expense.file_url && (
      <FiImage
        className="text-green-500 cursor-pointer hover:text-green-700"
        onClick={() => handleViewFile(expense.file_url)}
      />
    )}
  </td>
  <td className="px-2 py-1 border truncate max-w-[100px]">
    {expense.description || "Description non disponible"}
  </td>
  <td className="px-2 py-1 border text-right whitespace-nowrap">
    {expense.unit_price}
  </td>
  <td className="px-2 py-1 border text-right whitespace-nowrap">
    {expense.quantity}
  </td>
  <td className="px-2 py-1 border text-right whitespace-nowrap">
    {expense.total}
  </td>
  <td className="px-2 py-1 border text-center">
    <div className="flex flex-col items-center">
      <FiEdit
        className="cursor-pointer text-blue-500 mb-2"
        onClick={() => handleModifyExpense(expense)}
      />
      <FiTrash2
        className="cursor-pointer text-red-500"
        onClick={() => {
          setExpenseToDelete(expense);
          setIsConfirmDelete(true);
        }}
      />
    </div>
  </td>
</tr>
           ))
                  )}
                </tbody>
              </table>
            </div>

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
          <div className="flex justify-start">
            <button
              onClick={() => setIsAddingExpense(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 mb-2"
            >
              Ajouter Dépense
            </button>
          </div>

          <div className="w-full max-w-4xl bg-white p-2 rounded-md shadow-md overflow-x-auto border border-black">
            {loading ? (
              <p className="text-center text-gray-500">Chargement...</p>
            ) : (
              <table className="w-full table-fixed text-sm border-collapse border border-gray-300 rounded-md">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-2 py-1 border w-1/2 truncate">Nom du Projet</th>
                    <th className="px-2 py-1 border w-1/4 text-center">Total Dépenses</th>
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
                        <td className="px-2 py-1 border truncate max-w-[200px]">
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


      {/* Confirmation de création d'une autre dépense */}
      {isConfirmCreateAnother && (
        <ConfirmPopup
          message="Voulez-vous créer une autre dépense ?"
          onConfirm={handleCreateAnotherExpense}
          onCancel={handleCancelCreateAnother}   // Ferme le popup et rafraîchit les données
          />
      )}

      {/* Confirmation de suppression */}
      {isConfirmDelete && (
        <ConfirmPopup
          message="Êtes-vous sûr de vouloir supprimer cette dépense ?"
          onConfirm={handleDeleteExpense}
          onCancel={() => setIsConfirmDelete(false)}
        />
      )}
    </div>
  );
};

GestionDepenses.protected = true;

export default GestionDepenses;
