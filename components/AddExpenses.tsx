import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabaseClient";
import NotificationPopup from "./NotificationPopup";
import Loader from "./Loader";

const AddExpenses = ({ onCancel, onRefresh }: { onCancel: () => void; onRefresh: () => void }) => {
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [description, setDescription] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [total, setTotal] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [errors, setErrors] = useState({
    project: false,
    description: false,
    unitPrice: false,
    quantity: false,
  });
  const [isLoading, setIsLoading] = useState<boolean>(false); // État pour le chargement
  const [notification, setNotification] = useState({
    message: "",
    type: "info" as "success" | "error" | "info",
    isVisible: false,
    action: "none",
  });

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Charger les projets depuis Supabase
  useEffect(() => {
    const fetchProjects = async () => {
      setIsLoading(true); // Début du chargement
      const { data, error } = await supabase.from("projects").select("*");
      if (!error) setProjects(data || []);
      setIsLoading(false); // Fin du chargement
    };
    fetchProjects();
  }, []);

  // Mettre à jour le total en temps réel
  useEffect(() => {
    const numericUnitPrice = parseFloat(unitPrice.replace(/\s/g, "") || "0");
    const numericQuantity = parseInt(quantity || "0");
    const calculatedTotal = numericUnitPrice * numericQuantity;
    setTotal(calculatedTotal ? calculatedTotal.toLocaleString("fr-FR") : "");
  }, [unitPrice, quantity]);

  // Mettre à jour l'aperçu du fichier
  useEffect(() => {
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  }, [file]);

  // Formater le prix unitaire pour inclure des espaces
  const formatPrice = (value: string) => {
    const numericValue = value.replace(/\D/g, "");
    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  };

  // Gestion du téléversement de fichier sur Cloudinary
  const handleFileUpload = async () => {
    if (!file) return null;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "ml_default");

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/upload`,
        {
          method: "POST",
          body: formData,
        }
      );
      const data = await response.json();
      if (data.error) {
        throw new Error(data.error.message);
      }
      return data.secure_url; // Retourne l'URL de l'image téléversée
    } catch (error) {
      setNotification({
        message: "Erreur lors du téléversement de l'image.",
        type: "error",
        isVisible: true,
        action: "none",
      });
      return null;
    }
  };

  // Gérer l'ajout d'une dépense
  const handleAddExpense = async () => {
    const newErrors = {
      project: !selectedProject,
      description: !description,
      unitPrice: !unitPrice,
      quantity: !quantity,
    };
    setErrors(newErrors);

    if (Object.values(newErrors).some((field) => field)) {
      setNotification({
        message: "Tous les champs sont requis.",
        type: "error",
        isVisible: true,
        action: "none",
      });
      return;
    }

    setIsLoading(true); // Début du chargement
    const fileUrl = file ? await handleFileUpload() : null;

    const totalValue = parseFloat(unitPrice.replace(/\s/g, "")) * parseInt(quantity);

    const { error } = await supabase.from("expenses").insert([
      {
        project_id: selectedProject.id,
        description,
        unit_price: parseFloat(unitPrice.replace(/\s/g, "")),
        quantity: parseInt(quantity),
        total: totalValue,
        file_url: fileUrl,
      },
    ]);

    setIsLoading(false); // Fin du chargement

    if (error) {
      setNotification({
        message: "Erreur lors de l'ajout de la dépense.",
        type: "error",
        isVisible: true,
        action: "none",
      });
    } else {
      setNotification({
        message: "Dépense ajoutée avec succès.",
        type: "success",
        isVisible: true,
        action: "createAnother",
      });
    }
  };

  // Gestion des options caméra ou stockage
  const openCamera = () => {
    if (fileInputRef.current) {
      fileInputRef.current.setAttribute("capture", "environment");
      fileInputRef.current.click();
    }
  };

  const openStorage = () => {
    if (fileInputRef.current) {
      fileInputRef.current.removeAttribute("capture");
      fileInputRef.current.click();
    }
  };

  // Fonction pour gérer l'action de la notification
  const handleNotificationAction = () => {
    if (notification.action === "createAnother") {
      setDescription("");
      setUnitPrice("");
      setQuantity("");
      setTotal("");
      setFile(null);
      setPreview(null); // Réinitialiser l'aperçu de l'image
    } else {
      onCancel(); // Ferme la page d'ajout de dépense
      onRefresh(); // Rafraîchir la page des dépenses avec les nouvelles données
    }
    setNotification({ ...notification, isVisible: false });
  };

  // Condition pour afficher le loader pendant le chargement
  if (isLoading) {
    return <Loader />;
  }

  return (
    <div className="w-full max-w-lg mx-auto bg-white p-4 rounded-md shadow-md">
      <h2 className="text-lg font-bold mb-4">Ajouter une Dépense</h2>
      <div className="relative mb-4">
        <select
          value={selectedProject?.id || ""}
          onChange={(e) => {
            const project = projects.find((p) => p.id === parseInt(e.target.value));
            setSelectedProject(project);
          }}
          className={`p-2 w-full border rounded-md ${errors.project ? "bg-red-100" : ""}`}
        >
          <option value="">Sélectionnez un projet</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.title}
            </option>
          ))}
        </select>
      </div>
      <input
        type="text"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description"
        className={`mb-4 p-2 w-full border rounded-md ${errors.description ? "bg-red-100" : ""}`}
      />
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={unitPrice}
        onChange={(e) => setUnitPrice(formatPrice(e.target.value))}
        placeholder="Prix unitaire (ex: 1 000 000)"
        className={`mb-4 p-2 w-full border rounded-md ${errors.unitPrice ? "bg-red-100" : ""}`}
      />
      <input
        type="number"
        inputMode="numeric"
        value={quantity}
        onChange={(e) => setQuantity(e.target.value)}
        placeholder="Quantité"
        className={`mb-4 p-2 w-full border rounded-md ${errors.quantity ? "bg-red-100" : ""}`}
      />
      <input
        type="text"
        value={total}
        readOnly
        placeholder="Total"
        className="mb-4 p-2 w-full border rounded-md bg-gray-100 cursor-not-allowed"
      />
      <div className="mb-4">
        <button
          onClick={openCamera}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 mr-2"
        >
          Ouvrir la caméra
        </button>
        <button
          onClick={openStorage}
          className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
        >
          Ouvrir le stockage
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
      </div>

      {preview && (
        <div className="mb-4">
          <p className="text-sm text-gray-600">Aperçu de l'image :</p>
          <img src={preview} alt="Aperçu" className="w-full h-auto rounded-md border" />
        </div>
      )}

      <div className="flex justify-between">
        <button
          onClick={handleAddExpense}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          Ajouter
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
        >
          Annuler
        </button>
      </div>

      {notification.isVisible && (
        <NotificationPopup
          message={notification.message}
          type={notification.type}
          isVisible={notification.isVisible}
          onClose={() => setNotification({ ...notification, isVisible: false })}
          action={notification.action}
          onAction={handleNotificationAction}
        />
      )}
    </div>
  );
};

export default AddExpenses;
