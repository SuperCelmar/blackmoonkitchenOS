import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Order, OrderStatus, OrderType } from '../../types';

interface DraggableOrderCardProps {
  order: Order;
  onClick?: () => void;
}

const Icon = ({ name, className = "" }: { name: string, className?: string }) => (
  <span className={`material-symbols-outlined ${className}`}>{name}</span>
);

export function DraggableOrderCard({ order, onClick }: DraggableOrderCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    isDragging,
  } = useDraggable({
    id: order.id,
    disabled: order.type !== OrderType.DINE_IN,
  });

  const style = {
    // Don't apply transform - DragOverlay handles the moving element
    opacity: isDragging ? 0 : 1,
    // Smooth collapse transition
    transition: isDragging ? 'opacity 150ms ease' : undefined,
  };

  const total = order.items.reduce(
    (acc, item) => acc + item.quantity * item.menuItem.price,
    0
  );

  const statusColors = {
    [OrderStatus.PENDING]: {
      accent: 'bg-amber-500',
      bg: 'bg-amber-50 dark:bg-amber-900/20',
      text: 'text-amber-800 dark:text-amber-200',
      badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100',
    },
    [OrderStatus.VALIDATED]: {
      accent: 'bg-blue-500',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      text: 'text-blue-800 dark:text-blue-200',
      badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
    },
    [OrderStatus.READY]: {
      accent: 'bg-green-500',
      bg: 'bg-green-50 dark:bg-green-900/20',
      text: 'text-green-800 dark:text-green-200',
      badge: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
    },
    [OrderStatus.PAID]: {
      accent: 'bg-gray-500',
      bg: 'bg-gray-50 dark:bg-gray-900/20',
      text: 'text-gray-800 dark:text-gray-200',
      badge: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100',
    },
  };

  const colors = statusColors[order.status];

  const statusLabels = {
    [OrderStatus.PENDING]: 'NOUVEAU',
    [OrderStatus.VALIDATED]: 'EN CUISINE',
    [OrderStatus.READY]: 'PRÊT',
    [OrderStatus.PAID]: 'PAYÉ',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(order.type === OrderType.DINE_IN ? { ...attributes, ...listeners } : {})}
      onClick={onClick}
      className={`
        bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700
        relative overflow-hidden cursor-pointer
        transition-all duration-200
        hover:shadow-md hover:scale-[1.02] active:scale-[0.98]
        ${isDragging ? 'ring-2 ring-primary ring-offset-2' : ''}
        ${order.type !== OrderType.DINE_IN ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'}
      `}
    >
      {/* Left accent bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${colors.accent}`} />

      <div className="pl-3 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Icon
              name={order.type === OrderType.TAKEAWAY ? 'shopping_bag' : 'drag_indicator'}
              className={`text-lg ${order.type === OrderType.DINE_IN ? 'text-gray-400' : 'text-blue-500'}`}
            />
            <div className="flex-1 min-w-0">
              <div
                className={`text-[10px] font-bold uppercase tracking-wider ${
                  order.type === OrderType.TAKEAWAY ? 'text-blue-500' : 'text-gray-500'
                }`}
              >
                {order.type === OrderType.TAKEAWAY ? 'À Emporter' : 'Sur Place'}
              </div>
              {order.type === OrderType.DINE_IN && (
                <div className="flex items-center gap-1 mt-0.5">
                  <Icon name="group" className="text-gray-500 text-sm" />
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {order.numberOfPeople || 1}
                  </span>
                </div>
              )}
            </div>
          </div>
          <span className={`text-[10px] px-2 py-1 rounded font-bold whitespace-nowrap ${colors.badge}`}>
            {statusLabels[order.status]}
          </span>
        </div>

        {/* Items preview */}
        <div className="space-y-1.5">
          {order.items.slice(0, 3).map((item, idx) => (
            <div key={idx} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
              <span className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded font-bold text-[10px] min-w-[20px] text-center">
                {item.quantity}
              </span>
              <span className="truncate flex-1">{item.menuItem.nameFR}</span>
            </div>
          ))}
          {order.items.length > 3 && (
            <div className="text-[10px] text-gray-400 italic">
              +{order.items.length - 3} autre{order.items.length - 3 > 1 ? 's' : ''}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
          <span className="text-[10px] text-gray-400 flex items-center gap-1">
            <Icon name="schedule" className="text-xs" />
            {Math.floor((Date.now() - order.createdAt) / 60000)} min
          </span>
          <div className="text-sm font-bold text-primary dark:text-accent-gold">
            {total.toFixed(2)}€
          </div>
        </div>
      </div>
    </div>
  );
}

