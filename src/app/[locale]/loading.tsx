import { Spinner } from "@/components/ui/spinner";

export default function RootLoading() {
  return (
    <div
      className="flex min-h-[60vh] items-center justify-center"
      role="status"
      aria-label="Loading"
    >
      <Spinner />
    </div>
  );
}
