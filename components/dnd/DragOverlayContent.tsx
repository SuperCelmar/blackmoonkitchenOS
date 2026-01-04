import React from 'react';
import { Order, OrderType } from '../../types';

interface DragOverlayContentProps {
  order: Order;
}

const Icon = ({ name, className = "" }: { name: string, className?: string }) => (
  <span className={`material-symbols-outlined ${className}`}>{name}</span>
);

export function DragOverlayContent({ order }: DragOverlayContentProps) {
  const total = order.items.reduce(
    (acc, item) => acc + item.quantity * item.menuItem.price,
    0
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-full px-4 py-2 shadow-2xl border-2 border-primary flex items-center gap-3 min-w-[200px]">
      <div className="flex items-center gap-2">
        <Icon
          name={order.type === OrderType.TAKEAWAY ? 'shopping_bag' : 'table_restaurant'}
          className="text-primary text-lg"
        />
        {order.type === OrderType.DINE_IN && (
          <div className="flex items-center gap-1 bg-primary/10 px-2 py-0.5 rounded-full">
            <Icon name="group" className="text-primary text-xs" />
            <span className="text-xs font-bold text-primary">
              {order.numberOfPeople || 1}
            </span>
          </div>
        )}
      </div>
      <div className="flex-1 text-right">
        <div className="text-sm font-bold text-gray-900 dark:text-white">
          {total.toFixed(2)}€
        </div>
      </div>
    </div>
  );
}

