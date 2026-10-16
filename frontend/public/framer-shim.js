import * as React from "https://esm.sh/react@18.2.0";

export const addFonts = (c, f) => {};
export const addPropertyControls = (c, p) => {};
export const ControlType = {
  Color: "color",
  Number: "number",
  String: "string",
  Boolean: "boolean",
  Enum: "enum",
  Array: "array"
};
export const cx = (...args) => args.filter(Boolean).join(" ");
export const forwardLoader = fn => fn;
export const getFonts = () => [];
export const RichText = props => React.createElement("div", props);
export const runTasksWithYield = () => {};
export const ComponentViewportProvider = ({ children }) => children;
export const SmartComponentScopedContainer = ({ children, className, style, ...rest }) =>
  React.createElement("div", { className, style, ...rest }, children);

export const useComponentViewport = () => ({ x: 0, y: 0, width: 300, height: 300 });
export const useLocaleInfo = () => ({ activeLocale: "en", setLocale: () => {} });

export function useVariantState({ cycleOrder = [], defaultVariant, variant: controlledVariant, variantClassNames = {} }) {
  const [variant, setVariant] = React.useState(controlledVariant || defaultVariant);
  
  React.useEffect(() => {
    if (controlledVariant) setVariant(controlledVariant);
  }, [controlledVariant]);

  return {
    baseVariant: variant,
    classNames: variantClassNames[variant] || "",
    clearLoadingGesture: () => {},
    gestureHandlers: {},
    gestureVariant: undefined,
    isLoading: false,
    setGestureState: () => {},
    setVariant: (next) => setVariant(next),
    variants: [variant]
  };
}

export function useActiveVariantCallback(baseVariant) {
  const activeVariantCallback = React.useCallback((cb) => {
    return (...args) => cb(...args);
  }, []);

  const delay = React.useCallback((fn, ms) => {
    return new Promise(resolve => {
      setTimeout(() => {
        fn();
        resolve();
      }, ms);
    });
  }, []);

  return { activeVariantCallback, delay };
}

export function useOnVariantChange(baseVariant, handlers = {}) {
  React.useEffect(() => {
    const handler = handlers[baseVariant] || handlers.default;
    if (handler) {
      handler();
    }
  }, [baseVariant]);
}

export function withCSS(Component, css, className) {
  if (typeof document !== "undefined" && css && Array.isArray(css)) {
    const styleId = `framer-css-${className}`;
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.textContent = css.join("\n");
      document.head.appendChild(style);
    }
  }
  return Component;
}

export function withFX(Component) {
  return Component;
}
