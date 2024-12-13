// pages/api/deleteFile.ts
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const handler = async (req: { method: string; body: { public_id: any; }; }, res: { status: (arg0: number) => { (): any; new(): any; json: { (arg0: { error?: string; message?: string; }): any; new(): any; }; }; }) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  const { public_id } = req.body; // Extraire le public_id envoyé

  if (!public_id) {
    return res.status(400).json({ error: "public_id est requis" });
  }

  try {
    const result = await cloudinary.uploader.destroy(public_id); // Appel de l'API Cloudinary pour supprimer le fichier
    if (result.result === "ok") {
      return res.status(200).json({ message: "Fichier supprimé" });
    } else {
      return res.status(500).json({ error: "Erreur lors de la suppression du fichier" });
    }
  } catch (error) {
    console.error("Erreur de suppression Cloudinary:", error);
    return res.status(500).json({ error: "Erreur serveur lors de la suppression" });
  }
};

export default handler;
