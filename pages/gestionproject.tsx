import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import AddProject from "../components/AddProject";
import EditProject from "../components/EditProject";

const GestionProject = () => {
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [isEditingProject, setIsEditingProject] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(""); // Recherche pour autocomplétion
  const [filteredProjects, setFilteredProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<any>(null);

  // Charger les projets depuis Supabase
  const fetchProjects = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("projects").select("*");
    if (error) {
      console.error("Erreur lors de la récupération des projets :", error);
    } else {
      setProjects(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProjects(); // Charger les projets au montage
  }, []);

  useEffect(() => {
    // Filtrer les projets en fonction de la recherche
    setFilteredProjects(
      projects.filter((project) =>
        project.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
  }, [searchQuery, projects]);

  // Afficher le formulaire d'ajout
  const handleAddProjectClick = () => {
    setIsAddingProject(true);
  };

  // Activer le mode édition
  const handleEditProjectClick = () => {
    setSearchQuery(""); // Réinitialiser la barre de recherche
    setFilteredProjects(projects); // Afficher tous les projets au début
    setIsEditingProject(true);
  };

  // Annuler l'ajout ou l'édition
  const handleCancel = () => {
    setIsAddingProject(false);
    setIsEditingProject(false);
    setSelectedProject(null);
  };

  // Sélectionner un projet à modifier
  const handleSelectProject = (project: any) => {
    setSelectedProject(project);
    setIsEditingProject(false); // Désactiver la recherche
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-50">
      {isAddingProject ? (
        <AddProject onCancel={handleCancel} onRefresh={fetchProjects} />
      ) : selectedProject ? (
        <EditProject
          project={selectedProject}
          onCancel={handleCancel}
          onRefresh={fetchProjects}
        />
      ) : (
        <>
          
          <div className="flex gap-4 mb-2">
            <button
              onClick={handleAddProjectClick}
              className="px-6 py-2 bg-blue-500 text-white font-semibold rounded-md hover:bg-blue-600"
            >
              Ajouter un Projet
            </button>
            <button
              onClick={handleEditProjectClick}
              className="px-6 py-2 bg-green-500 text-white font-semibold rounded-md hover:bg-green-600"
            >
              Modifier un Projet
            </button>
          </div>

          {isEditingProject && (
            <div className="mb-4 w-full max-w-lg">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher un projet..."
                className="p-2 border border-gray-300 rounded-md w-full"
              />
              <ul className="mt-2 bg-white shadow-md rounded-md max-h-40 overflow-auto">
                {filteredProjects.map((project) => (
                  <li
                    key={project.id}
                    className="p-2 hover:bg-gray-100 cursor-pointer"
                    onClick={() => handleSelectProject(project)}
                  >
                    {project.title}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="bg-white shadow-md p-2 w-full max-w-4xl rounded-md border border-black">
            <h2 className="text-lg font-bold text-gray-800 mb-2 text-center">
              Liste des Projets
            </h2>
            {loading ? (
              <p className="text-center text-gray-500">Chargement...</p>
            ) : filteredProjects.length === 0 ? (
              <p className="text-center text-gray-500">
                Aucun projet trouvé.
              </p>
            ) : (
              <table className="w-full table-fixed text-sm border-collapse border border-gray-300 rounded-md">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-2 py-1 border w-1/2 truncate">Nom</th>
                    <th className="px-2 py-1 border w-1/4 text-center">
                      Date de Début
                    </th>
                    <th className="px-2 py-1 border w-1/4 text-center">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProjects.map((project) => (
                    <tr key={project.id} className="hover:bg-gray-50">
                      <td className="px-2 py-1 border truncate">{project.title}</td>
                      <td className="px-2 py-1 border text-center">
                        {new Date(project.start_date).toLocaleDateString()}
                      </td>
                      <td className="px-2 py-1 border text-center flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleSelectProject(project)}
                          className="text-blue-500 hover:underline"
                        >
                          Modifier
                        </button>
                        <button
                          onClick={() => alert("Icône clic sélection")}
                          className="text-green-500 hover:text-green-700"
                        >
                          &#9998; {/* Icône de modification */}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
};

GestionProject.protected = true;

export default GestionProject;
