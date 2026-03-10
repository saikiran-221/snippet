interface Props {
  params: { id: string };
}

export default function SnippetPage({ params }: Props) {
  return (
    <div>
      <h1>Snippet: {params.id}</h1>
    </div>
  );
}
