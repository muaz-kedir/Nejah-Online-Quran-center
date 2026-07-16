import { useEffect, useState } from "react";

export function Loader() {
  const [show, setShow] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setShow(false), 200);
    return () => clearTimeout(t);
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-background grid place-items-center animate-fade-out" style={{ animationDelay: "150ms", animationFillMode: "forwards" }}>
      <div className="size-16 rounded-2xl bg-primary grid place-items-center p-2 animate-spin" style={{ animationDuration: "1.4s" }}>
        <img src="/logo.png" alt="Nejah" className="h-full w-auto" />
      </div>
    </div>
  );
}
