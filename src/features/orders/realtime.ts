import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getSocket } from "@/lib/socket";
import { orderKeys } from "./queries";
import type { Order, OrderStatus } from "./types";

interface OrderRealtimeUpdate {
  id: string;
  status: OrderStatus;
}

export function useRealtimeOrderStatus(orderId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    let cancelled = false;
    let activeSocket: Awaited<ReturnType<typeof getSocket>> | undefined;

    function handleUpdate(update: OrderRealtimeUpdate) {
      if (update.id !== orderId) return;
      queryClient.setQueryData<Order>(orderKeys.detail(orderId), (current) =>
        current ? { ...current, status: update.status } : current,
      );
    }

    void getSocket().then((socket) => {
      if (cancelled) return;
      activeSocket = socket;
      socket.on("order.updated", handleUpdate);
    });

    return () => {
      cancelled = true;
      activeSocket?.off("order.updated", handleUpdate);
    };
  }, [orderId, queryClient]);
}
