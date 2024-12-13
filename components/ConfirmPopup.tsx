import { useState, useEffect } from "react";

const ConfirmPopup = ({
  message,
  onConfirm,
  onCancel,
}: {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) => {
  // Déclarez l'état pour stocker la réponse de l'utilisateur et si la réponse est correcte
  const [userAnswer, setUserAnswer] = useState<number | string>(""); 
  const [isAnswerCorrect, setIsAnswerCorrect] = useState<boolean>(false);
  
  // Générez une opération mathématique aléatoire (ici addition entre 1 et 10)
  const [num1, setNum1] = useState<number>(0);
  const [num2, setNum2] = useState<number>(0);
  const [correctAnswer, setCorrectAnswer] = useState<number>(0);

  useEffect(() => {
    // Créez une opération mathématique aléatoire
    const number1 = Math.floor(Math.random() * 10) + 1; // Nombre entre 1 et 10
    const number2 = Math.floor(Math.random() * 10) + 1; // Nombre entre 1 et 10
    setNum1(number1);
    setNum2(number2);
    setCorrectAnswer(number1 + number2); // Calculer la réponse correcte (addition)
  }, []); // Lancer une seule fois lors du premier rendu

  const handleAnswerChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const answer = parseInt(event.target.value, 10);
    setUserAnswer(answer);

    // Vérifiez si la réponse est correcte
    if (answer === correctAnswer) {
      setIsAnswerCorrect(true);
    } else {
      setIsAnswerCorrect(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-4 rounded-md shadow-md max-w-lg w-full">
        <p className="text-center">{message}</p>

        {/* Ajoutez la question mathématique dynamique */}
        <div className="mt-4 text-center">
          <p className="text-xl font-semibold">Quel est le résultat de {num1} + {num2} ?</p>
          <input
            type="number"
            value={userAnswer}
            onChange={handleAnswerChange}
            className="mt-2 p-2 border rounded-md text-center"
            placeholder="Réponse"
          />
        </div>

        {/* Boutons pour confirmer ou annuler */}
        <div className="flex justify-center gap-4 mt-4">
          <button
            onClick={onConfirm}
            disabled={!isAnswerCorrect} // Désactive le bouton si la réponse est incorrecte
            className={`px-4 py-2 ${isAnswerCorrect ? "bg-red-500" : "bg-gray-500"} text-white rounded-md hover:bg-red-600`}
          >
            Supprimer
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmPopup;
