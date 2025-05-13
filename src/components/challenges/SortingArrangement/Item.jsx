export function Item({ id, value, isDragging, colorClass = 'bg-blue-500'  }) {
    const height = value * 20;
    const isMinHeight = height === 20;

    return (
        <div className={`flex flex-col items-center ${
            isDragging ? 'shadow-lg cursor-grabbing' : 'cursor-grab'
        }`}>
            <div
                className={`${colorClass} w-12 rounded-lg flex items-end justify-center text-black font-bold text-lg transition-all`}
                style={{ height: `${height}px`, minHeight: '20px' }}
            >
                <span className={`${isMinHeight ? 'mb-4' : 'mb-1'}`}>{value}</span>
            </div>
        </div>
    );
}