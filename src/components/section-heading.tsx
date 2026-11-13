import type { ReactNode } from "react";

type SectionHeadingProps = {
  headingId?: string;
  title: string;
  kicker: string;
  meta?: ReactNode;
  metaClassName?: string;
};

export function SectionHeading({
  headingId,
  title,
  kicker,
  meta,
  metaClassName = "",
}: SectionHeadingProps) {
  return (
    <div className="section-heading">
      <div>
        <div className="section-kicker">{kicker}</div>
        <h2 id={headingId}>{title}</h2>
      </div>
      {meta && <span className={`section-meta ${metaClassName}`}>{meta}</span>}
    </div>
  );
}
