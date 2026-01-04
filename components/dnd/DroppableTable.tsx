import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Order, OrderStatus, OrderType, Table } from '../../types';

interface DroppableTableProps {
  table: Table;
  isOccupied: boolean;
  isValidDrop: boolean;
  isDragging: boolean;
  order?: Order | null;
  onClick?: () => void;
  onMouseDown?: (e: React.MouseEvent) => void;
  onLabelChange?: (label: string) => void;
  mapEditMode?: boolean;
}

const Icon = ({ name, className = "" }: { name: string, className?: string }) => (
  <span className={`material-symbols-outlined ${className}`}>{name}</span>
);

export function DroppableTable({
  table,
  isOccupied,
  isValidDrop,
  isDragging,
  order,
  onClick,
  onMouseDown,
  onLabelChange,
  mapEditMode = false,
}: DroppableTableProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: table.id,
  });

  const isRect = table.type === 'RECT';
  const showGlow = isDragging && isValidDrop && !isOccupied && (isOver || false);

  return (
    <div
      ref={setNodeRef}
      onMouseDown={onMouseDown}
      onClick={onClick}
      style={{
        left: table.x,
        top: table.y,
        width: isRect ? 140 : 96,
        height: 96,
        cursor: mapEditMode ? 'move' : 'pointer',
        position: 'absolute',
      }}
      className={`
        flex flex-col items-center justify-center group transition-all duration-300
        ${mapEditMode ? 'z-50' : 'z-10'}
        ${isDragging && !isValidDrop
          ? 'saturate-50'
          : ''
        }
      `}
    >
      <div
        className={`
          relative flex items-center justify-center transition-all duration-300
          ${isRect ? 'w-full h-24 rounded-lg' : 'w-24 h-24 rounded-full'}
          ${
            showGlow
              ? 'bg-primary/10 dark:bg-primary/15 border-2 border-primary shadow-xl scale-105'
              : isOccupied
                ? 'bg-orange-50/50 dark:bg-orange-900/10 border-2 border-orange-200 dark:border-orange-800/50 shadow-sm'
                : 'bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 hover:border-primary dark:hover:border-primary shadow-sm'
          }
        `}
      >
        {/* Decorative side bars for rectangular tables */}
        {isRect ? (
          <>
            <div
              className={`absolute -left-2 top-2 bottom-2 w-2 rounded-l transition-colors ${
                showGlow
                  ? 'bg-primary/60 dark:bg-primary/70'
                  : isOccupied
                    ? 'bg-orange-200 dark:bg-orange-800/50'
                    : 'bg-gray-200 dark:bg-gray-600 group-hover:bg-primary/30'
              }`}
            />
            <div
              className={`absolute -right-2 top-2 bottom-2 w-2 rounded-r transition-colors ${
                showGlow
                  ? 'bg-primary/60 dark:bg-primary/70'
                  : isOccupied
                    ? 'bg-orange-200 dark:bg-orange-800/50'
                    : 'bg-gray-200 dark:bg-gray-600 group-hover:bg-primary/30'
              }`}
            />
          </>
        ) : (
          <>
            <div
              className={`absolute -top-3 w-8 h-2 rounded-full transition-colors ${
                showGlow
                  ? 'bg-primary/60 dark:bg-primary/70'
                  : isOccupied
                    ? 'bg-orange-200 dark:bg-orange-800/50'
                    : 'bg-gray-200 dark:bg-gray-600 group-hover:bg-primary/30'
              }`}
            />
            <div
              className={`absolute -bottom-3 w-8 h-2 rounded-full transition-colors ${
                showGlow
                  ? 'bg-primary/60 dark:bg-primary/70'
                  : isOccupied
                    ? 'bg-orange-200 dark:bg-orange-800/50'
                    : 'bg-gray-200 dark:bg-gray-600 group-hover:bg-primary/30'
              }`}
            />
          </>
        )}

        {/* Pending order indicator */}
        {order && order.status === OrderStatus.PENDING && (
          <div className="absolute -top-1 -right-1 h-5 w-5 bg-primary rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center text-white text-[10px] font-bold z-20 animate-pulse">
            !
          </div>
        )}

        {/* Table label */}
        {mapEditMode ? (
          <input
            value={table.label}
            onChange={(e) => onLabelChange?.(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            className="w-10 text-center bg-transparent font-bold text-xl outline-none"
          />
        ) : (
          <span
            className={`font-display text-2xl font-bold transition-colors ${
              showGlow
                ? 'text-primary'
                : isOccupied
                  ? 'text-orange-700 dark:text-orange-300'
                  : 'text-gray-400 group-hover:text-primary'
            }`}
          >
            {table.label}
          </span>
        )}
      </div>

      {/* Status label */}
      <div className="flex flex-col items-center gap-1 mt-2">
        <span
          className={`text-sm font-bold px-2 py-0.5 rounded backdrop-blur-sm transition-colors ${
            showGlow
              ? 'text-primary bg-primary/20 dark:bg-primary/30'
              : isOccupied
                ? 'text-orange-600 dark:text-orange-400 bg-white/80 dark:bg-black/50'
                : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'
          }`}
        >
          {isOccupied ? 'Occupé' : 'Libre'}
        </span>
        {!mapEditMode && (
          <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500 px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">
            Max {table.capacity}
          </span>
        )}
      </div>
    </div>
  );
}

