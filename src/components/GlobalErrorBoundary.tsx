import { Component, type ReactNode, type ErrorInfo } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class GlobalErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(err: Error): State {
    return { hasError: true, error: err };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const DEBUG_ALERTS_ENABLED = true; // Set to true to see alert dialogs

    // Log to console always
    console.error("Uncaught error:", error, errorInfo);

    if (DEBUG_ALERTS_ENABLED) {
      const errorMsg = `React Error Boundary Caught:\n${error.toString()}\n\nComponent Stack:\n${errorInfo.componentStack}`;
      alert(errorMsg);
    }
  }

  public render() {
    // if (this.state.hasError) {
    //   return (
    //     <div style={{ padding: '2rem', color: 'red', textAlign: 'center' }}>
    //       <h1>Something went wrong.</h1>
    //       <p>Please check the alert dialog for the error details.</p>
    //       <button 
    //         onClick={() => window.location.reload()}
    //         style={{ 
    //           marginTop: '1rem', 
    //           padding: '0.5rem 1rem', 
    //           border: '1px solid currentColor',
    //           background: 'transparent'
    //         }}
    //       >
    //         Reload Page
    //       </button>
    //     </div>
    //   );
    // }

    return this.props.children;
  }
}

export default GlobalErrorBoundary;
