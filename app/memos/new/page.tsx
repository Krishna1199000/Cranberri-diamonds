// app/memos/new/page.tsx
import { MemoForm } from "@/components/memo/memo-form"; // Import MemoForm (to be created)

export default function NewMemoPage() { // Renamed function
  return (
    <div className="container py-10 max-w-6xl">
      <MemoForm /> {/* Use MemoForm */}
    </div>
  );
}
 