import * as React from "react";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      const newValue = window.innerWidth < MOBILE_BREAKPOINT;
      console.log('[useIsMobile] onChange called', { innerWidth: window.innerWidth, newValue });
      setIsMobile(newValue);
    };
    mql.addEventListener("change", onChange);
    const initialValue = window.innerWidth < MOBILE_BREAKPOINT;
    console.log('[useIsMobile] Initial value set', { innerWidth: window.innerWidth, initialValue });
    setIsMobile(initialValue);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  const result = !!isMobile;
  React.useEffect(() => {
    console.log('[useIsMobile] isMobile updated:', result);
  }, [result]);

  return result;
}
