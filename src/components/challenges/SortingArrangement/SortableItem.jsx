import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Item } from './Item.jsx';

export function SortableItem({ id, value, colorClass  }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style = {
        touchAction: 'none',
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={`${isDragging ? 'opacity-50' : 'opacity-100'} flex-shrink-0`}
        >
            <Item id={id} value={value} colorClass={colorClass}/>
        </div>
    );
}