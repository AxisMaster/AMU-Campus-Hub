export default function SkeletonEventCard() {
    return (
        <div className="bg-amu-card rounded-3xl overflow-hidden mb-6 border border-amu relative animate-pulse">
            <div className="h-64 w-full bg-gray-800" />
            <div className="p-5">
                <div className="h-4 bg-gray-700 rounded w-1/4 mb-3" />
                <div className="h-6 bg-gray-700 rounded w-3/4 mb-4" />
                <div className="flex justify-between items-center mt-4">
                    <div className="flex -space-x-2">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="w-8 h-8 rounded-full border-2 border-var(--card) bg-gray-700" />
                        ))}
                    </div>
                    <div className="h-10 w-24 bg-gray-700 rounded-full" />
                </div>
            </div>
        </div>
    );
}
