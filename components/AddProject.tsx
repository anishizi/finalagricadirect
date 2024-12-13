import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import NotificationPopup from "./NotificationPopup";

// Define types for notification
type NotificationType = "error" | "info" | "success";

interface NotificationState {
  message: string;
  type: NotificationType;
  isVisible: boolean;
  action: string;
}

const AddProject = ({
  onCancel,
  onRefresh,
}: {
  onCancel: () => void;
  onRefresh: () => void;
}) => {
  // Project states
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [estimatedCost, setEstimatedCost] = useState("");
  const [duration, setDuration] = useState(0);

  // Task states
  const [tasks, setTasks] = useState<{ title: string; status: boolean }[]>([
    { title: "", status: false },
  ]);

  // Notification state with explicit typing
  const [notification, setNotification] = useState<NotificationState>({
    message: "",
    type: "info",
    isVisible: false,
    action: "",
  });

  // Validation errors
  const [errors, setErrors] = useState({
    title: false,
    startDate: false,
    endDate: false,
    estimatedCost: false,
  });

  // Format cost
  const formatCost = (value: string) => {
    const number = value.replace(/\D/g, "");
    return number.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  };

  // Calculate duration
  const calculateDuration = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const timeDifference = endDate.getTime() - startDate.getTime();
    return timeDifference / (1000 * 3600 * 24);
  };

  // Save project
  const saveProject = async () => {
    const newErrors = {
      title: !title,
      startDate: !startDate,
      endDate: !endDate || new Date(endDate) <= new Date(startDate),
      estimatedCost: !estimatedCost,
    };

    setErrors(newErrors);

    if (Object.values(newErrors).includes(true)) {
      setNotification({
        message: "Tous les champs sont requis ou invalides.",
        type: "error",
        isVisible: true,
        action: "none",
      });
      return;
    }

    try {
      const { data: projectData, error: projectError } = await supabase
        .from("projects")
        .insert([
          {
            title,
            start_date: startDate,
            end_date: endDate,
            duration,
            estimated_cost: estimatedCost.replace(/\s/g, ""),
          },
        ])
        .select("id");

      if (projectError) throw projectError;

      const projectId = projectData[0]?.id;

      // Add tasks if they exist
      if (tasks.some((task) => task.title.trim() !== "")) {
        const taskInserts = tasks
          .filter((task) => task.title.trim() !== "")
          .map((task) => ({
            title: task.title,
            status: task.status,
            project_id: projectId,
          }));

        const { error: taskError } = await supabase.from("tasks").insert(taskInserts);
        if (taskError) throw taskError;
      }

      setNotification({
        message: "Projet et tâches ajoutés avec succès !",
        type: "success",
        isVisible: true,
        action: "none",
      });

      // Reset states
      setTitle("");
      setStartDate("");
      setEndDate("");
      setEstimatedCost("");
      setDuration(0);
      setTasks([{ title: "", status: false }]);

      onRefresh(); // Refresh project list
    } catch (error) {
      console.error("Erreur :", error);
      setNotification({
        message: "Une erreur est survenue.",
        type: "error",
        isVisible: true,
        action: "none",
      });
    }
  };

  // Add a new task field
  const addTaskField = () => {
    setTasks([...tasks, { title: "", status: false }]);
  };

  // Update a task
  const updateTask = <K extends keyof { title: string; status: boolean }>(
    index: number,
    key: K,
    value: { title: string; status: boolean }[K]
  ) => {
    const updatedTasks = [...tasks];
    updatedTasks[index][key] = value;
    setTasks(updatedTasks);
  };

  return (
    <div className="w-full max-w-lg mx-auto p-4 bg-white shadow-md rounded-md">
      <h2 className="text-2xl font-bold mb-4 text-center">Ajouter un Projet</h2>
      <form onSubmit={(e) => e.preventDefault()}>
        <div className="mb-4">
          <label className="block text-gray-700">Titre du projet</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={`w-full p-2 border rounded-md ${
              errors.title ? "bg-red-100" : ""
            }`}
            required
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
            className={`w-full p-2 border rounded-md ${
              errors.startDate ? "bg-red-100" : ""
            }`}
            required
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
            min={startDate}
            className={`w-full p-2 border rounded-md ${
              errors.endDate ? "bg-red-100" : ""
            }`}
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700">Durée en jours</label>
          <input
            type="text"
            value={duration}
            readOnly
            className="w-full p-2 border rounded-md"
            disabled
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700">Coût total estimé</label>
          <input
            type="text"
            value={estimatedCost}
            onChange={(e) => setEstimatedCost(formatCost(e.target.value))}
            className={`w-full p-2 border rounded-md ${
              errors.estimatedCost ? "bg-red-100" : ""
            }`}
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700">Tâches</label>
          {tasks.map((task, index) => (
            <div key={index} className="flex items-center gap-2 mb-2">
              <input
                type="text"
                value={task.title}
                onChange={(e) => updateTask(index, "title", e.target.value)}
                placeholder={`Tâche ${index + 1}`}
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
            </div>
          ))}
          <button
            type="button"
            onClick={addTaskField}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Ajouter une tâche
          </button>
        </div>

        <div className="flex justify-between">
          <button
            type="button"
            onClick={saveProject}
            className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Enregistrer
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
          type={notification.type}
          isVisible={notification.isVisible}
          onClose={() => setNotification({ ...notification, isVisible: false })}
          action={notification.action}
          onAction={() => setNotification({ ...notification, isVisible: false })}
        />
      )}
    </div>
  );
};

// Set protected property if needed for route guards
AddProject.protected = true;

export default AddProject;
