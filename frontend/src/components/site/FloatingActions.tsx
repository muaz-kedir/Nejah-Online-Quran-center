import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp, MessageCircle } from "lucide-react";

export function FloatingActions() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 400);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-3 items-end">
      <AnimatePresence>
        {show && (
          <motion.button
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            aria-label="Back to top"
            className="glass-panel grid size-12 place-items-center rounded-full transition hover:border-nejah-electric/40 hover:text-nejah-electric"
          >
            <ArrowUp className="size-5" />
          </motion.button>
        )}
      </AnimatePresence>
      <a
        href="https://wa.me/15558009300"
        target="_blank"
        rel="noreferrer"
        aria-label="WhatsApp"
        className="size-14 rounded-full bg-[#25D366] text-white shadow-elevated grid place-items-center hover:scale-110 transition-transform"
      >
        <MessageCircle className="size-6" />
        <span className="absolute size-14 rounded-full bg-[#25D366] animate-ping opacity-30" />
      </a>
    </div>
  );
}
