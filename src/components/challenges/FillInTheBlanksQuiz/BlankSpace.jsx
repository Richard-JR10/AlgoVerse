import { useDroppable } from '@dnd-kit/core';

export function BlankSpace({ id, answer, isSubmitted, correctAnswer }) {
    const { isOver, setNodeRef } = useDroppable({
        id,
    });

    const getBlankStyle = () => {
        if (!answer) return 'bg-gray-100 border-gray-300';
        if (!isSubmitted) return 'bg-blue-50 border-blue-400';
        return answer === correctAnswer
            ? 'bg-green-50 border-green-400'
            : 'bg-red-50 border-red-400';
    };

    return (
        <span
            ref={setNodeRef}
            className={`inline-block mx-1 px-3 py-1 border-2 rounded-md min-w-[80px] text-center align-middle ${getBlankStyle()} ${
                isOver ? 'ring-2 ring-blue-400' : ''
            }`}
        >
      {answer || '_____'}
    </span>
    );
}