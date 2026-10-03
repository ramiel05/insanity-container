import { createContext, useContext, useState } from "react";
import { useMutation, useQuery, useQueryClient, type UseQueryResult } from "@tanstack/react-query";
import * as api from "#lib/api";
import { effectiveTimeZone } from "#lib/day";
import { latestError, listsKey, northStarsKey, settingsKey, starsKey } from "#lib/workspace-cache";
import {
  useKindMutations,
  type CreateStarInput,
  type KindMutations,
  type StarPatch,
  type WorkspaceHandlers,
} from "#lib/workspace-mutations";
import type { ConfirmState, Kind, ModalKind, Selected } from "#lib/kinds";
import type {
  Blueshift,
  BlueshiftStar,
  CreateBlueshift,
  CreateRedshift,
  Redshift,
  RedshiftStar,
  Settings,
  UpdateBlueshift,
  UpdateRedshift,
} from "@proj/shared";

export interface WorkspaceOps {
  readonly createShift: (kind: Kind, input: CreateBlueshift | CreateRedshift) => void;
  readonly updateShift: (kind: Kind, id: string, patch: UpdateBlueshift | UpdateRedshift) => void;
  readonly deleteShift: (kind: Kind, id: string) => void;
  readonly createStar: (kind: Kind, shiftId: string, input: CreateStarInput) => void;
  readonly updateStar: <K extends Kind>(kind: K, id: string, patch: StarPatch<K>) => void;
  readonly deleteStar: (kind: Kind, id: string) => void;
  readonly updateSettings: (input: { readonly timezone: string | null }) => void;
}

export interface WorkspaceErrors {
  readonly createShift: (kind: Kind) => string | undefined;
  readonly deleteShift: (kind: Kind) => string | undefined;
  readonly createStar: (kind: Kind) => string | undefined;
  readonly latestStar: (kind: Kind) => string | undefined;
  readonly settings: string | undefined;
}

export type ShiftOf<K extends Kind> = K extends "blueshift" ? Blueshift : Redshift;
export type StarOf<K extends Kind> = K extends "blueshift" ? BlueshiftStar : RedshiftStar;

export interface Workspace {
  readonly shifts: {
    (kind: "blueshift"): readonly Blueshift[];
    (kind: "redshift"): readonly Redshift[];
    (kind: Kind): readonly (Blueshift | Redshift)[];
  };
  readonly starsOf: {
    (kind: "blueshift"): readonly BlueshiftStar[];
    (kind: "redshift"): readonly RedshiftStar[];
    (kind: Kind): readonly (BlueshiftStar | RedshiftStar)[];
  };
  readonly selectedShift: {
    (kind: "blueshift"): Blueshift | undefined;
    (kind: "redshift"): Redshift | undefined;
    (kind: Kind): (Blueshift | Redshift) | undefined;
  };
  readonly northStars: readonly BlueshiftStar[];
  readonly settings?: Settings;
  readonly timeZone: string;
  readonly selected: Selected;
  readonly select: (kind: Kind, id: string) => void;
  readonly modal: ModalKind;
  readonly openModal: (modal: Exclude<ModalKind, null>) => void;
  readonly closeModal: () => void;
  readonly confirm: ConfirmState | null;
  readonly confirmDelete: (message: string, action: () => void) => void;
  readonly queryError: Error | null;
  readonly northStarsError: Error | null;
  readonly pending: boolean;
  readonly ops: WorkspaceOps;
  readonly errors: WorkspaceErrors;
}

interface KindState<K extends Kind> {
  readonly list: UseQueryResult<ShiftOf<K>[]>;
  readonly stars: UseQueryResult<StarOf<K>[]>;
  readonly mutations: KindMutations;
}

function useKindState<K extends Kind>(
  kind: K,
  list: UseQueryResult<ShiftOf<K>[]>,
  stars: UseQueryResult<StarOf<K>[]>,
  handlers: WorkspaceHandlers,
): KindState<K> {
  return { list, stars, mutations: useKindMutations(kind, handlers) };
}

function stateFor(kind: Kind, blueshift: KindState<"blueshift">, redshift: KindState<"redshift">): KindState<Kind> {
  return kind === "blueshift" ? blueshift : redshift;
}

export const WorkspaceContext = createContext<Workspace | null>(null);

export function useWorkspace(): Workspace {
  const workspace = useContext(WorkspaceContext);
  if (workspace === null) throw new Error("useWorkspace requires a WorkspaceProvider");
  return workspace;
}

export function useWorkspaceState(): Workspace {
  const client = useQueryClient();
  const [selected, setSelected] = useState<Selected>(null);
  const [modal, setModal] = useState<ModalKind>(null);
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);
  const select = (kind: Kind, id: string): void => {
    setSelected({ kind, id });
  };
  const closeModal = (): void => {
    setModal(null);
  };
  const handlers: WorkspaceHandlers = {
    onSelected: select,
    onDeleted: (kind, id) => {
      if (selected?.kind === kind && selected.id === id) setSelected(null);
    },
    onCloseModal: closeModal,
  };
  const blueshiftState = useKindState(
    "blueshift",
    useQuery({ queryKey: listsKey("blueshift"), queryFn: api.listBlueshifts }),
    useQuery({
      queryKey: [...starsKey(), "blueshift", selected?.id],
      queryFn: async () => {
        if (!selected) throw new Error("Cannot list Blueshift Stars without a selected Blueshift");
        const rows = await api.listBlueshiftStars(selected.id);
        return rows;
      },
      enabled: selected?.kind === "blueshift",
    }),
    handlers,
  );
  const redshiftState = useKindState(
    "redshift",
    useQuery({ queryKey: listsKey("redshift"), queryFn: api.listRedshifts }),
    useQuery({
      queryKey: [...starsKey(), "redshift", selected?.id],
      queryFn: async () => {
        if (!selected) throw new Error("Cannot list Redshift Stars without a selected Redshift");
        const rows = await api.listRedshiftStars(selected.id);
        return rows;
      },
      enabled: selected?.kind === "redshift",
    }),
    handlers,
  );
  const northStarsQuery = useQuery({ queryKey: northStarsKey(), queryFn: api.listNorthStars });
  const settingsQuery = useQuery({ queryKey: settingsKey(), queryFn: api.getSettings });
  const forState = (kind: Kind): KindState<Kind> => stateFor(kind, blueshiftState, redshiftState);

  const updateSettings = useMutation({
    mutationFn: async (input: { readonly timezone: string | null }) => {
      const settings = await api.updateSettings(input);
      return settings;
    },
    onSuccess: () => {
      closeModal();
      void client.invalidateQueries({ queryKey: settingsKey() });
    },
  });

  function shiftsFor(kind: "blueshift"): readonly Blueshift[];
  function shiftsFor(kind: "redshift"): readonly Redshift[];
  function shiftsFor(kind: Kind): readonly (Blueshift | Redshift)[];
  function shiftsFor(kind: Kind): readonly (Blueshift | Redshift)[] {
    return forState(kind).list.data ?? [];
  }

  function starsFor(kind: "blueshift"): readonly BlueshiftStar[];
  function starsFor(kind: "redshift"): readonly RedshiftStar[];
  function starsFor(kind: Kind): readonly (BlueshiftStar | RedshiftStar)[];
  function starsFor(kind: Kind): readonly (BlueshiftStar | RedshiftStar)[] {
    return forState(kind).stars.data ?? [];
  }

  function selectedShiftFor(kind: "blueshift"): Blueshift | undefined;
  function selectedShiftFor(kind: "redshift"): Redshift | undefined;
  function selectedShiftFor(kind: Kind): (Blueshift | Redshift) | undefined;
  function selectedShiftFor(kind: Kind): (Blueshift | Redshift) | undefined {
    const data = forState(kind).list.data;
    return data?.find((item) => item.id === selected?.id && selected?.kind === kind);
  }

  const ops: WorkspaceOps = {
    createShift: (kind, input) => {
      forState(kind).mutations.create.mutate(input);
    },
    updateShift: (kind, id, patch) => {
      forState(kind).mutations.update.mutate([id, patch]);
    },
    deleteShift: (kind, id) => {
      forState(kind).mutations.remove.mutate(id);
    },
    createStar: (kind, shiftId, input) => {
      forState(kind).mutations.createStar.mutate([shiftId, input]);
    },
    updateStar: (kind, id, patch) => {
      forState(kind).mutations.updateStar.mutate([id, patch]);
    },
    deleteStar: (kind, id) => {
      forState(kind).mutations.removeStar.mutate(id);
    },
    updateSettings: (input) => {
      updateSettings.mutate(input);
    },
  };

  const errors: WorkspaceErrors = {
    createShift: (kind) => forState(kind).mutations.create.error?.message,
    deleteShift: (kind) => forState(kind).mutations.remove.error?.message,
    createStar: (kind) => forState(kind).mutations.createStar.error?.message,
    latestStar: (kind) => {
      const { createStar, updateStar, removeStar } = forState(kind).mutations;
      return latestError([createStar, updateStar, removeStar]);
    },
    settings: updateSettings.error?.message,
  };

  const confirmDelete = (message: string, action: () => void): void => {
    setConfirm({ message, action });
    setModal("confirm");
  };

  const queryError =
    blueshiftState.list.error ??
    redshiftState.list.error ??
    northStarsQuery.error ??
    blueshiftState.stars.error ??
    redshiftState.stars.error ??
    settingsQuery.error;

  return {
    shifts: shiftsFor,
    starsOf: starsFor,
    selectedShift: selectedShiftFor,
    northStars: northStarsQuery.data ?? [],
    settings: settingsQuery.data,
    timeZone: effectiveTimeZone(),
    selected,
    select,
    modal,
    openModal: (next) => {
      setModal(next);
    },
    closeModal,
    confirm,
    confirmDelete,
    queryError,
    northStarsError: northStarsQuery.error,
    pending: blueshiftState.list.isPending || redshiftState.list.isPending || northStarsQuery.isPending,
    ops,
    errors,
  };
}
