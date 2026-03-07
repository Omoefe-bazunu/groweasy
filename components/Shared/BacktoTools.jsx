import { ArrowLeftCircle } from "lucide-react";
import Link from "next/link";

const BacktoTools = () => {
  return (
    <div className="mb-6">
      <Link
        href="/businesstools"
        className="flex items-center gap-2 text-white transition-colors"
      >
        <div className="flex items-center gap-2 bg-[#5247bf] rounded w-fit px-4 py-2">
          <ArrowLeftCircle />
          <p>Back to Tools</p>
        </div>
      </Link>
    </div>
  );
};

export default BacktoTools;
