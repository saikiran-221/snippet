interface Props {
  params: { username: string };
}

export default function UserProfilePage({ params }: Props) {
  return (
    <div>
      <h1>Profile: @{params.username}</h1>
    </div>
  );
}
