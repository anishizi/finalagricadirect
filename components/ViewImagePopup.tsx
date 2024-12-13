import { FiX } from "react-icons/fi";

const ViewImagePopup = ({ selectedFile, handleCloseFilePopup }: { selectedFile: string, handleCloseFilePopup: () => void }) => {

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="relative bg-white p-4 rounded-md shadow-md w-full max-w-4xl h-full flex flex-col justify-center items-center overflow-auto">
        {/* Close Button */}
        <button
          onClick={handleCloseFilePopup}
          className="absolute top-2 right-2 p-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
        >
          <FiX size={20} />
        </button>

        {/* Image */}
        <div className="flex justify-center items-center" style={{ maxHeight: '90vh', overflow: 'hidden' }}>
          <img
            src={selectedFile}
            alt="Fichier"
            className="transition-transform duration-200"
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain', // Pour que l'image ne dépasse pas et soit centrée
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default ViewImagePopup;
