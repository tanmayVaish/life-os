"use client";

import { useState } from "react";
import { DetailPanel } from "@/components/detail-panel";

type TaskRowProps = {
  time: string;
  title: string;
  detail: string;
  checked?: boolean;
};

export function TaskRow({
  time,
  title,
  detail,
  checked = false,
}: TaskRowProps) {
  const [isChecked, setIsChecked] = useState(checked);

  return (
    <li className="today-item">
      <label className="task-check">
        <input
          aria-label={`${isChecked ? "Completed" : "Mark complete"}: ${title}`}
          checked={isChecked}
          onChange={(event) => setIsChecked(event.target.checked)}
          type="checkbox"
        />
        <span className="checkmark" />
      </label>
      <DetailPanel
        className={`task-disclosure${isChecked ? " task-is-done" : ""}`}
        label={title}
        summary={
          <span className="task-summary">
            <time className="task-time">{time}</time>
            <span className="task-title">{title}</span>
          </span>
        }
      >
        <p>{detail}</p>
      </DetailPanel>
    </li>
  );
}
