import { useState, useCallback } from 'react';
import { Active, Over } from '@dnd-kit/core';
import { Order, OrderStatus, OrderType, Table } from '../types';
import { updateOrder } from '../services/menuService';

interface UseOrderDnDProps {
  orders: Order[];
  tables: Table[];
  onUpdateStatus: (orderId: string, status: OrderStatus) => void;
  onAssignTable: (orderId: string, tableLabel: string) => void;
  onUndoDrop?: (orderId: string, previousStatus: OrderStatus, previousTable: string | null) => void;
}

interface PendingDrop {
  orderId: string;
  tableLabel: string;
  previousStatus: OrderStatus;
  previousTable: string | null;
}

export function useOrderDnD({
  orders,
  tables,
  onUpdateStatus,
  onAssignTable,
  onUndoDrop,
}: UseOrderDnDProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [pendingDrop, setPendingDrop] = useState<PendingDrop | null>(null);

  const getTableStatus = useCallback((tableLabel: string) => {
    const activeOrder = orders.find(
      (o) =>
        o.tableNumber === tableLabel &&
        o.status !== OrderStatus.PAID &&
        o.type === OrderType.DINE_IN
    );
    if (activeOrder) return { status: 'OCCUPIED' as const, order: activeOrder };
    return { status: 'FREE' as const, order: null };
  }, [orders]);

  const isTableValidForOrder = useCallback(
    (table: Table, orderId: string): boolean => {
      const order = orders.find((o) => o.id === orderId);
      if (!order || order.type !== OrderType.DINE_IN) return false;

      const { status } = getTableStatus(table.label);
      const numberOfPeople = order.numberOfPeople || 1;

      return status === 'FREE' && table.capacity >= numberOfPeople;
    },
    [orders, getTableStatus]
  );

  const handleDragStart = useCallback((event: { active: Active }) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragOver = useCallback((event: { active: Active; over: Over | null }) => {
    setOverId(event.over?.id as string | null);
  }, []);

  const handleDragEnd = useCallback(
    async (event: { active: Active; over: Over | null }) => {
      const orderId = event.active.id as string;
      const tableId = event.over?.id as string;

      setActiveId(null);
      setOverId(null);

      if (!tableId) return;

      const table = tables.find((t) => t.id === tableId);
      if (!table) return;

      const order = orders.find((o) => o.id === orderId);
      if (!order || order.type !== OrderType.DINE_IN) return;

      if (!isTableValidForOrder(table, orderId)) return;

      // Store previous state for undo
      const previousStatus = order.status;
      const previousTable = order.tableNumber;

      // Auto-validate if pending
      if (order.status === OrderStatus.PENDING) {
        try {
          await updateOrder(orderId, {
            status: OrderStatus.VALIDATED,
            tableNumber: table.label,
          });
          onUpdateStatus(orderId, OrderStatus.VALIDATED);
          onAssignTable(orderId, table.label);

          // Set pending drop for undo
          setPendingDrop({
            orderId,
            tableLabel: table.label,
            previousStatus,
            previousTable,
          });
        } catch (error) {
          console.error('Error updating order:', error);
        }
      } else {
        // Just assign table if already validated
        onAssignTable(orderId, table.label);
      }
    },
    [orders, tables, isTableValidForOrder, onUpdateStatus, onAssignTable]
  );

  const handleUndo = useCallback(async () => {
    if (!pendingDrop) return;

    const { orderId, previousStatus, previousTable } = pendingDrop;

    try {
      await updateOrder(orderId, {
        status: previousStatus,
        tableNumber: previousTable || null,
      });

      onUpdateStatus(orderId, previousStatus);
      if (previousTable) {
        onAssignTable(orderId, previousTable);
      } else {
        onAssignTable(orderId, '');
      }

      if (onUndoDrop) {
        onUndoDrop(orderId, previousStatus, previousTable);
      }

      setPendingDrop(null);
    } catch (error) {
      console.error('Error undoing drop:', error);
    }
  }, [pendingDrop, onUpdateStatus, onAssignTable, onUndoDrop]);

  const getActiveOrder = useCallback((): Order | null => {
    if (!activeId) return null;
    return orders.find((o) => o.id === activeId) || null;
  }, [activeId, orders]);

  const getOverTable = useCallback((): Table | null => {
    if (!overId) return null;
    return tables.find((t) => t.id === overId) || null;
  }, [overId, tables]);

  return {
    activeId,
    overId,
    pendingDrop,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleUndo,
    getActiveOrder,
    getOverTable,
    isTableValidForOrder,
    getTableStatus,
  };
}

