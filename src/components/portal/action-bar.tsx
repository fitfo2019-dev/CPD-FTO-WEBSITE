export function ActionBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-20 border-t bg-white/95 backdrop-blur lg:left-[232px]">
      <div className="mx-auto flex max-w-[1200px] flex-wrap justify-end gap-3 px-4 py-3 sm:px-8">{children}</div>
    </div>
  );
}
