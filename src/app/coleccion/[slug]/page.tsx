import CollectionClient from "./CollectionClient";

export default function CollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  return <CollectionClient params={params} />;
}