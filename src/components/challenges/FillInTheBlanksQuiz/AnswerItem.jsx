import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

export function AnswerItem({ id, option, isDragging }) {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id,
        data: { option }
    });

    const style = {
        transform: CSS.Translate.toString(transform),
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={`px-4 py-2 bg-blue-100 text-blue-800 rounded-lg cursor-grab active:cursor-grabbing ${
                isDragging ? 'opacity-50 shadow-lg' : 'opacity-100 shadow'
            }`}
        >
            {option}
        </div>
    );
}