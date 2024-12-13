import Head from "next/head";

interface MetaProps {
  title?: string;
  description?: string;
  keywords?: string;
  author?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogUrl?: string;
}

const Meta = ({
  title = "Agrica Direct",
  description = "Famille agriculture gestion",
  keywords = "agriculture, gestion, famille, projets, finances",
  author = "Agrica Team",
  ogTitle = "Agrica Direct",
  ogDescription = "Simplifiez la gestion agricole avec Agrica Direct.",
  ogImage = "/default-og-image.jpg",
  ogUrl = "http://88.137.7.10:3001/",
}: MetaProps) => {
  return (
    <Head>
      {/* Meta de base */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content={author} />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />

      {/* Open Graph / Facebook */}
      <meta property="og:title" content={ogTitle} />
      <meta property="og:description" content={ogDescription} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:url" content={ogUrl} />
      <meta property="og:type" content="website" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={ogTitle} />
      <meta name="twitter:description" content={ogDescription} />
      <meta name="twitter:image" content={ogImage} />
    </Head>
  );
};

export default Meta;
