import type React from "react";
import { BlueshiftPanel } from "./BlueshiftPanel";
import { RedshiftPanel } from "./RedshiftPanel";
import type { Blueshift, BlueshiftStar, Redshift, RedshiftStar } from "@proj/shared";

export interface StarErrors {
  readonly latest?: string;
  readonly create?: string;
}

export function SelectedPanel({
  selectedBlueshift,
  selectedRedshift,
  stars,
  redshiftStars,
  timeZone,
  starErrors,
  onCreateStar,
  onCreateRedshiftStar,
  onToggleStar,
  onToggleRedshiftStar,
  onNorthStar,
  onDeleteStar,
  onDeleteRedshiftStar,
}: {
  readonly selectedBlueshift?: Blueshift;
  readonly selectedRedshift?: Redshift;
  readonly stars: readonly BlueshiftStar[];
  readonly redshiftStars: readonly RedshiftStar[];
  readonly timeZone: string;
  readonly starErrors: { readonly blueshift: StarErrors; readonly redshift: StarErrors };
  readonly onCreateStar: (title: string) => void;
  readonly onCreateRedshiftStar: (title: string) => void;
  readonly onToggleStar: (starId: string, completed: boolean) => void;
  readonly onToggleRedshiftStar: (starId: string, completed: boolean) => void;
  readonly onNorthStar: (starId: string, northStar: boolean) => void;
  readonly onDeleteStar: (starId: string, title: string) => void;
  readonly onDeleteRedshiftStar: (starId: string, title: string) => void;
}): React.JSX.Element {
  if (selectedBlueshift) {
    return (
      <BlueshiftPanel
        blueshift={selectedBlueshift}
        stars={stars}
        starError={starErrors.blueshift.latest}
        starCreateError={starErrors.blueshift.create}
        onCreateStar={onCreateStar}
        onToggle={onToggleStar}
        onNorthStar={onNorthStar}
        onDelete={onDeleteStar}
      />
    );
  }
  if (selectedRedshift) {
    return (
      <RedshiftPanel
        redshift={selectedRedshift}
        stars={redshiftStars}
        timeZone={timeZone}
        starError={starErrors.redshift.latest}
        starCreateError={starErrors.redshift.create}
        onCreateStar={onCreateRedshiftStar}
        onToggle={onToggleRedshiftStar}
        onDelete={onDeleteRedshiftStar}
      />
    );
  }
  return (
    <div className="flex min-h-64 items-center justify-center" aria-label="No Blueshift or Redshift selected">
      <p className="text-muted">{"Select a Redshift or Blueshift to see its Stars."}</p>
    </div>
  );
}
