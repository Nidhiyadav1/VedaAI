export const DifficultyBadge = ({ difficulty }: { difficulty: string }) => {
  const styles: Record<string, string> = {
    Easy: 'bg-green-100 text-green-700 border border-green-300',
    Moderate: 'bg-yellow-100 text-yellow-700 border border-yellow-300',
    Hard: 'bg-red-100 text-red-700 border border-red-300',
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${styles[difficulty] || 'bg-gray-100 text-gray-600'}`}>
      {difficulty}
    </span>
  );
};