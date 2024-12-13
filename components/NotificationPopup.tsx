import { FiCheckCircle, FiXCircle, FiInfo } from "react-icons/fi"; // Icônes pour succès, erreur, et info

interface NotificationPopupProps {
  message: string;
  type: "success" | "error" | "info";
  isVisible: boolean;
  onClose: () => void;
  action: string; // action pour décider quel bouton afficher
  onAction: (action: string) => void;
}

const NotificationPopup: React.FC<NotificationPopupProps> = ({
  message,
  type,
  isVisible,
  onClose,
  action,
  onAction,
}) => {
  if (!isVisible) return null;

  let bgColor;
  let textColor;

  // Choisir la couleur de fond et de texte en fonction du type de notification
  switch (type) {
    case "success":
      bgColor = "bg-green-500";
      textColor = "text-white";
      break;
    case "error":
      bgColor = "bg-red-500";
      textColor = "text-white";
      break;
    case "info":
      bgColor = "bg-blue-500";
      textColor = "text-white";
      break;
    default:
      bgColor = "bg-gray-500";
      textColor = "text-white";
      break;
  }

  return (
    <>
      {/* Arrière-plan flou */}
      <div className="fixed top-0 left-0 right-0 bottom-0 bg-black bg-opacity-50 backdrop-blur-lg z-40" />

      <div
        className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 p-6 rounded-lg shadow-lg ${bgColor} ${textColor} flex flex-col items-center space-y-4 z-50`}
      >
        {/* Message */}
        <div className="text-center text-xl font-semibold">{message}</div>

        {/* Affichage des boutons basés sur l'action */}
        {action === "createAnother" && (
          <div className="mt-4 flex space-x-4 w-full">
            <button
              onClick={() => onAction("createAnother")}
              className="w-full py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition"
            >
              Créer un autre projet
            </button>
            <button
              onClick={() => onAction("goToProjectPage")}
              className="w-full py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition"
            >
              Non merci
            </button>
          </div>
        )}

        {/* Affichage du bouton "Fermer" uniquement si l'action n'est pas "createAnother" */}
        {action === "none" && (
          <div className="mt-4 w-full">
            <button
              onClick={onClose}
              className="w-full py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition"
            >
              Fermer
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default NotificationPopup;
