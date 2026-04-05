import { Electroview } from "electrobun/view";
import type { MdKanbanRPC } from "../../../shared/rpc";
import type { Board } from "../../../shared/types";

type BoardChangedPayload = { projectId: number; board: Board };
type FileErrorPayload = { projectId: number; error: string };

const rpc = Electroview.defineRPC<MdKanbanRPC>({
  handlers: {
    requests: {},
    messages: {
      boardChanged: async (payload: BoardChangedPayload) => {
        const { useBoardStore } = await import("../stores/board-store");
        const store = useBoardStore.getState();
        if (!store.editingTask) {
          store.setBoard(payload.board);
        }
      },
      fileError: (payload: FileErrorPayload) => {
        console.error(`File error for project ${payload.projectId}:`, payload.error);
      },
    },
  },
});

const view = new Electroview({ rpc });

export { rpc, view };
