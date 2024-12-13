import { useRouter } from 'next/router';

const NotApproved = () => {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <h1 className="text-2xl font-bold mb-4">Compte non approuvé</h1>
      <p className="text-gray-600 mb-4">Votre compte est en attente d'approbation.</p>
      <button onClick={() => router.push('/auth/login')} className="bg-blue-500 text-white px-6 py-2 rounded">
        Retourner à la connexion
      </button>
    </div>
  );
};

export default NotApproved;
