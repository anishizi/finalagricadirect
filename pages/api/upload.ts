import type { NextApiRequest, NextApiResponse } from "next";
import cloudinary from "../../lib/cloudinary";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  try {
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: "auto",
          upload_preset: uploadPreset, // Utilisez la variable d'environnement
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );

      req.pipe(uploadStream);
    });

    res.status(200).json({ url: (result as any).secure_url }); // Retourne l'URL du fichier téléversé
  } catch (error) {
    console.error("Erreur lors du téléversement :", error);
    res.status(500).json({ error: "Échec du téléversement du fichier." });
  }
};

export default handler;
