import type React from "react";
import { BlueshiftPanel } from "./BlueshiftPanel";
import { RedshiftPanel } from "./RedshiftPanel";
import type { StarErrors } from "#lib/hooks";
import type { Blueshift, BlueshiftStar, Redshift, RedshiftStar } from "@proj/shared";

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
  readonly onToggleStar: (star: BlueshiftStar, completed: boolean) => void;
  readonly onToggleRedshiftStar: (star: RedshiftStar, completed: boolean) => void;
  readonly onNorthStar: (star: BlueshiftStar, northStar: boolean) => void;
  readonly onDeleteStar: (star: BlueshiftStar) => void;
  readonly onDeleteRedshiftStar: (star: RedshiftStar) => void;
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
      <p className="text-muted">{"Select a Blueshift or Redshift from the sidebar."}</p>
    </div>
  );
}
