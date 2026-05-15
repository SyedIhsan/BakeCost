/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

type Props = { className?: string; size?: number };

export function PackagingIcon({ className, size = 20 }: Props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeLinejoin="round"
      strokeLinecap="round"
      strokeWidth="1.25"
      className={className}
      aria-hidden="true"
    >
      <path d="M1.584 4.5L8 1.583L14.417 4.5m-12.833 0L8 7.417M1.584 4.5v6.417L8 14.417m0-7L14.417 4.5M8 7.417v7M14.417 4.5v6.417L8 14.417M11 3L5 6v7" />
    </svg>
  );
}
