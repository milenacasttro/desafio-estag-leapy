import TalentList from "@/components/TalentList";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 p-8 border-t border-gray-200">
      <div className="max-w-[98%] mx-auto">
        <TalentList />
      </div>
    </main>
  );
}
