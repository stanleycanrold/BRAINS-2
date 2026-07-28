import * as React from "react";
import { cn } from "@/lib/cn";

/**
 * Design system §3.6.
 *
 * 48px rows (40px in dense/Ops contexts), hairline row borders, and NO zebra
 * striping - more precise at this data density, less decorative (§Part 6).
 */

export function Table({
  className,
  dense = false,
  children,
  ...props
}: React.TableHTMLAttributes<HTMLTableElement> & { dense?: boolean }) {
  return (
    <div className="w-full overflow-x-auto">
      <table
        data-dense={dense || undefined}
        className={cn("w-full border-collapse text-left", className)}
        {...props}
      >
        {children}
      </table>
    </div>
  );
}

export function Thead({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead className={cn("border-b border-line", className)} {...props} />
  );
}

export function Th({
  className,
  align = "left",
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement> & {
  align?: "left" | "right" | "center";
}) {
  return (
    <th
      scope="col"
      className={cn(
        "type-caption px-3 py-2.5 font-medium text-secondary uppercase whitespace-nowrap",
        align === "right" && "text-right",
        align === "center" && "text-center",
        className,
      )}
      {...props}
    />
  );
}

export function Tbody({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={className} {...props} />;
}

export function Tr({
  className,
  interactive,
  ...props
}: React.HTMLAttributes<HTMLTableRowElement> & { interactive?: boolean }) {
  return (
    <tr
      className={cn(
        "border-b border-line last:border-b-0",
        interactive && "cursor-pointer transition-colors hover:bg-wash-row",
        className,
      )}
      {...props}
    />
  );
}

export function Td({
  className,
  align = "left",
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement> & {
  align?: "left" | "right" | "center";
}) {
  return (
    <td
      className={cn(
        "type-body-m px-3 py-3 align-top text-primary",
        "group-data-[dense]:py-2",
        align === "right" && "text-right",
        align === "center" && "text-center",
        className,
      )}
      {...props}
    />
  );
}
