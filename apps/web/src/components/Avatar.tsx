const PALETTE = ['#D6336C', '#C9A24B', '#8B5CF6', '#0EA5E9', '#10B981', '#F59E0B'];

export function Avatar({
  name,
  photo,
  size = 40,
}: {
  name: string;
  photo?: string | null;
  size?: number;
}) {
  if (photo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photo}
        alt={name}
        width={size}
        height={size}
        className="rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  const color = PALETTE[(name.charCodeAt(0) ?? 0) % PALETTE.length];
  return (
    <div
      className="flex items-center justify-center rounded-full font-semibold text-white"
      style={{ width: size, height: size, backgroundColor: color, fontSize: size * 0.42 }}
    >
      {name[0]?.toUpperCase() ?? '?'}
    </div>
  );
}
