import { Logo } from "@/components/brand/Logo";

/**
 * The signed-out shell. Deliberately quiet — this is the instrument panel's
 * front door, not a landing page (marketing site is a separate property).
 */
export function AuthLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-[420px]">
        <div className="mb-8 text-center">
          <div className="flex justify-center">
            <Logo size={20} priority />
          </div>
          <h1 className="type-display-l mt-6 text-primary">{title}</h1>
          <p className="type-body-l mt-2 text-secondary">{subtitle}</p>
        </div>
        <div className="flex justify-center">{children}</div>
      </div>
    </div>
  );
}
