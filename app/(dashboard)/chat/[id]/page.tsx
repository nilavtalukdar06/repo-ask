type ChatPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ChatPage({ params }: ChatPageProps) {
  const { id } = await params;

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <h1 className="text-lg font-medium">Chat {id}</h1>
    </div>
  );
}
