import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabaseClient";
import NotificationPopup from "./NotificationPopup";

// Fonction pour formater les chiffres avec des espaces
const formatNumber = (value: string) => {
  // Supprimer les caractères non numériques sauf les espaces
  const numericValue = value.replace(/\D/g, "");
  // Ajouter un espace tous les 3 chiffres
  return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
};

const ModifyExpense = ({ expense, onCancel, onRefresh }: { expense: any; onCancel: () => void; onRefresh: () => void }) => {
  const [description, setDescription] = useState(expense.description || "");
  const [unitPrice, setUnitPrice] = useState(expense.unit_price.toString() || "");
  const [quantity, setQuantity] = useState(expense.quantity.toString() || "");
  const [total, setTotal] = useState(expense.total.toString() || "");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(expense.file_url || null);
  const [notification, setNotification] = useState({
    message: "",
    type: "info" as "success" | "error" | "info",
    isVisible: false,
    action: "none",
  });

  const fileInputRef = useRef<HTMLInputElement | null>(null);

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
      setPreview(expense.file_url || null);
    }
  }, [file, expense.file_url]);

  // Fonction de téléchargement du fichier sur Cloudinary
  const handleFileUpload = async () => {
    if (!file) return null; // Retourner l'URL de l'image existante si aucun fichier n'est téléchargé

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
      return data.secure_url;
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

  // Supprimer le fichier de Cloudinary avant de télécharger le nouveau
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
      console.error("Erreur lors de la suppression du fichier de Cloudinary :", error);
    }
  };

  // Sauvegarder les modifications
  const handleSave = async () => {
    const fileUrl = file ? await handleFileUpload() : expense.file_url;

    // Supprimer l'ancien fichier si un nouveau fichier est téléchargé
    if (file && expense.file_url) {
      const publicId = expense.file_url.split("/").pop()?.split(".")[0];
      if (publicId) {
        await deleteFileFromCloudinary(publicId);
      }
    }

    const { error } = await supabase
      .from("expenses")
      .update({
        description,
        unit_price: parseFloat(unitPrice.replace(/\s/g, "")),
        quantity: parseInt(quantity),
        total: parseFloat(total.replace(/\s/g, "")),
        file_url: fileUrl,
      })
      .eq("id", expense.id);

    if (error) {
      setNotification({
        message: "Erreur lors de la mise à jour de la dépense.",
        type: "error",
        isVisible: true,
        action: "none",
      });
    } else {
      setNotification({
        message: "Dépense mise à jour avec succès.",
        type: "success",
        isVisible: true,
        action: "none",
      });
      onRefresh(); // Rafraîchir la liste des dépenses
      onCancel(); // Fermer le formulaire
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto bg-white p-4 rounded-md shadow-md">
      <h2 className="text-lg font-bold mb-4">Modifier une Dépense</h2>

      <input
        type="text"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description"
        className="mb-4 p-2 w-full border rounded-md"
      />

      <input
        type="text"
        value={unitPrice}
        onChange={(e) => setUnitPrice(formatNumber(e.target.value))}  
        placeholder="Prix unitaire"
        className="mb-4 p-2 w-full border rounded-md"
      />

<input
  type="number"
  value={quantity}
  onChange={(e) => {
    // Validation pour autoriser uniquement des chiffres
    const value = e.target.value;
    if (/^\d+$/.test(value) || value === "") {
      setQuantity(value);  // Mettre à jour uniquement si la valeur est numérique
    }
  }}
  placeholder="Quantité"
  className="mb-4 p-2 w-full border rounded-md"
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
          onClick={() => fileInputRef.current?.click()}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 mr-2"
        >
          Choisir un fichier
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
          onClick={handleSave}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          Sauvegarder
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
          onClose={() => setNotification({ ...notification, isVisible: false })} action={""} onAction={function (action: string): void {
            throw new Error("Function not implemented.");
          } }        />
      )}
    </div>
  );
};

export default ModifyExpense;
