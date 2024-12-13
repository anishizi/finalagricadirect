import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import NotificationPopup from "./NotificationPopup";

// Define types
type NotificationType = "error" | "info" | "success";

interface NotificationState {
  message: string;
  type: NotificationType;
  isVisible: boolean;
  action: string;
}

const EditProject = ({
  project,
  onCancel,
  onRefresh,
}: {
  project: any;
  onCancel: () => void;
  onRefresh: () => void;
}) => {
  // Project states
  const [title, setTitle] = useState(project?.title || "");
  const [startDate, setStartDate] = useState(project?.start_date || "");
  const [endDate, setEndDate] = useState(project?.end_date || "");
  const [estimatedCost, setEstimatedCost] = useState(project?.estimated_cost || "");
  const [duration, setDuration] = useState(project?.duration || 0);

  // State for distinguishing deletion context (project or task)
  const [deleteContext, setDeleteContext] = useState<"project" | "task" | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<number | null>(null);

  // Task states
  const [tasks, setTasks] = useState<any[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);

  // Notification state
  const [notification, setNotification] = useState<NotificationState>({
    message: "",
    type: "info",
    isVisible: false,
    action: "",
  });

  // States for delete confirmation
  const [isDeletePopupVisible, setDeletePopupVisible] = useState(false);
  const [deleteFormula, setDeleteFormula] = useState<number>(0);
  const [userAnswer, setUserAnswer] = useState<number | string>("");

  // Fetch tasks associated with the project
  const fetchTasks = async () => {
    setLoadingTasks(true);
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("project_id", project.id);

    if (error) {
      console.error("Erreur lors de la récupération des tâches :", error);
    } else {
      setTasks(data || []);
    }
    setLoadingTasks(false);
  };

  useEffect(() => {
    if (project?.id) {
      fetchTasks();
    }
  }, [project?.id]);

  // Calculate duration
  const calculateDuration = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const timeDifference = endDate.getTime() - startDate.getTime();
    return timeDifference / (1000 * 3600 * 24);
  };

  // Save project changes
  const saveChanges = async () => {
    try {
      const { error: projectError } = await supabase
        .from("projects")
        .update({
          title,
          start_date: startDate,
          end_date: endDate,
          duration,
          estimated_cost: estimatedCost,
        })
        .eq("id", project.id);

      if (projectError) throw projectError;

      // Update tasks
      for (const task of tasks) {
        if (task.id) {
          // Update existing task
          const { error: taskError } = await supabase
            .from("tasks")
            .update({ title: task.title, status: task.status })
            .eq("id", task.id);

          if (taskError) throw taskError;
        } else {
          // Add new task
          const { error: newTaskError } = await supabase
            .from("tasks")
            .insert({
              title: task.title,
              status: task.status,
              project_id: project.id,
            });

          if (newTaskError) throw newTaskError;
        }
      }

      setNotification({
        message: "Projet et tâches mis à jour avec succès !",
        type: "success",
        isVisible: true,
        action: "none",
      });

      onRefresh();
    } catch (error) {
      console.error("Erreur lors de la mise à jour :", error);
      setNotification({
        message: "Une erreur est survenue lors de la mise à jour.",
        type: "error",
        isVisible: true,
        action: "none",
      });
    }
  };

  // Delete project and associated tasks
  const deleteProject = async () => {
    try {
      const { error: tasksError } = await supabase
        .from("tasks")
        .delete()
        .eq("project_id", project.id);

      if (tasksError) throw tasksError;

      const { error: projectError } = await supabase
        .from("projects")
        .delete()
        .eq("id", project.id);

      if (projectError) throw projectError;

      setNotification({
        message: "Projet supprimé avec succès.",
        type: "success",
        isVisible: true,
        action: "none",
      });

      onRefresh();
      onCancel();
    } catch (error) {
      console.error("Erreur lors de la suppression :", error);
      setNotification({
        message: "Une erreur est survenue lors de la suppression.",
        type: "error",
        isVisible: true,
        action: "none",
      });
    }
  };

  // Add a new task
  const addTaskField = () => {
    setTasks([...tasks, { title: "", status: false }]);
  };

  // Update a task
  const updateTask = (index: number, key: "title" | "status", value: any) => {
    const updatedTasks = [...tasks];
    updatedTasks[index][key] = value;
    setTasks(updatedTasks);
  };

  // Show delete confirmation popup
  const showDeletePopup = (context: "project" | "task", taskId?: number | null) => {
    const randomNum1 = Math.floor(Math.random() * 10) + 1;
    const randomNum2 = Math.floor(Math.random() * 10) + 1;
    setDeleteFormula(randomNum1 + randomNum2);
    setDeleteContext(context);
    setTaskToDelete(taskId || null);
    setDeletePopupVisible(true);
  };

  // Handle delete confirmation
  const handleDeleteConfirmation = () => {
    if (Number(userAnswer) === deleteFormula) {
      if (deleteContext === "project") {
        deleteProject();
      } else if (deleteContext === "task" && taskToDelete !== null) {
        supabase
          .from("tasks")
          .delete()
          .eq("id", taskToDelete)
          .then(({ error }) => {
            if (error) {
              console.error("Erreur lors de la suppression de la tâche :", error);
            } else {
              fetchTasks();
              setNotification({
                message: "Tâche supprimée avec succès.",
                type: "success",
                isVisible: true,
                action: "none",
              });
            }
          });
      }
      setDeletePopupVisible(false);
    } else {
      setNotification({
        message: "La réponse est incorrecte. La suppression est annulée.",
        type: "error",
        isVisible: true,
        action: "none",
      });
      setDeletePopupVisible(false);
    }
  };

  function deleteTask(arg0: any): void {
    throw new Error("Function not implemented.");
  }

  return (
    <div className="w-full max-w-lg mx-auto p-4 bg-white shadow-md rounded-md">
      <h2 className="text-2xl font-bold mb-4 text-center">Modifier le Projet</h2>
      <form onSubmit={(e) => e.preventDefault()}>
        {/* Formulaire de modification du projet */}
        <div className="mb-4">
          <label className="block text-gray-700">Titre du projet</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-2 border rounded-md"
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700">Date de début</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              if (endDate) setDuration(calculateDuration(e.target.value, endDate));
            }}
            className="w-full p-2 border rounded-md"
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700">Date de fin</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              if (startDate) setDuration(calculateDuration(startDate, e.target.value));
            }}
            className="w-full p-2 border rounded-md"
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700">Coût total estimé</label>
          <input
            type="text"
            value={estimatedCost}
            onChange={(e) => setEstimatedCost(e.target.value)}
            className="w-full p-2 border rounded-md"
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700">Tâches</label>
          {loadingTasks ? (
            <p>Chargement des tâches...</p>
          ) : tasks.length === 0 ? (
            <p>Aucune tâche trouvée.</p>
          ) : (
            tasks.map((task, index) => (
              <div key={task.id || index} className="flex items-center gap-2 mb-2">
                <input
                  type="text"
                  value={task.title}
                  onChange={(e) => updateTask(index, "title", e.target.value)}
                  className="flex-1 p-2 border rounded-md"
                />
                <label className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={task.status}
                    onChange={(e) => updateTask(index, "status", e.target.checked)}
                    className="h-4 w-4"
                  />
                  Fait
                </label>
                <button
                  type="button"
                  onClick={() => deleteTask(task.id || null)}
                  className="text-red-500"
                >
                  Supprimer
                </button>
              </div>
            ))
          )}
          <button
            type="button"
            onClick={addTaskField}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Ajouter une tâche
          </button>
        </div>

        <div className="flex justify-between mt-4">
          <button
            type="button"
            onClick={saveChanges}
            className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Confirmer
          </button>
          <button
  type="button"
  onClick={() => showDeletePopup("project")}
  className="px-6 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
>
  Supprimer
</button>

          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
          >
            Annuler
          </button>
        </div>
      </form>

      {notification.isVisible && (
      <NotificationPopup
      message={notification.message}
      type={notification.type} // Now properly typed
      isVisible={notification.isVisible}
      onClose={() => setNotification({ ...notification, isVisible: false })}
      action={notification.action}
      onAction={() => setNotification({ ...notification, isVisible: false })}
    />
    
      )}

      {/* Popup de confirmation de suppression */}
      {isDeletePopupVisible && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
            <h3 className="text-xl font-bold mb-4">Confirmer la suppression</h3>
            <p className="mb-4">
              Pour confirmer la suppression, résolvez cette addition :
            </p>
            <p className="text-2xl font-bold mb-4">{`Quel est ${deleteFormula}?`}</p>
            <input
              type="number"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              className="w-full p-2 border rounded-md mb-4"
            />
            <div className="flex justify-between">
              <button
                onClick={handleDeleteConfirmation}
                className="px-4 py-2 bg-green-500 text-white rounded-md"
              >
                Confirmer
              </button>
              <button
                onClick={() => setDeletePopupVisible(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded-md"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
EditProject.protected = true;
export default EditProject;
