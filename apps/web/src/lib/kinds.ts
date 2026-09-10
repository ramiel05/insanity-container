export type Kind = "blueshift" | "redshift";

export type Selected = { readonly kind: Kind; readonly id: string } | null;

export type ModalKind = "blueshift" | "redshift" | "settings" | "confirm" | null;

export interface ConfirmState {
  readonly message: string;
  readonly action: () => void;
}
