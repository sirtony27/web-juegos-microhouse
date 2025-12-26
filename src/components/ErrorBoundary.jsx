import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ errorInfo });
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex flex-col items-center justify-center bg-[#09090b] text-white p-4 font-sans text-center">
                    <div className="w-20 h-20 bg-brand-red/10 rounded-full flex items-center justify-center mb-6 border border-brand-red/20 shadow-[0_0_30px_rgba(230,36,41,0.2)]">
                        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-red">
                            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                            <line x1="12" y1="9" x2="12" y2="13" />
                            <line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                    </div>

                    <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">Algo salió mal</h1>
                    <p className="text-gray-400 max-w-md mb-8 text-lg">
                        Tuvimos un problema técnico inesperado. Por favor, intentá recargar la página.
                    </p>

                    <div className="flex flex-col gap-4 w-full max-w-xs">
                        <button
                            onClick={() => window.location.reload()}
                            className="w-full px-6 py-3 bg-brand-red hover:bg-red-600 text-white font-bold rounded-xl transition-all hover:scale-105 shadow-lg shadow-brand-red/20"
                        >
                            Recargar Página
                        </button>

                        <button
                            onClick={() => window.location.href = '/'}
                            className="w-full px-6 py-3 bg-white/5 hover:bg-white/10 text-white font-medium rounded-xl border border-white/10 transition-colors"
                        >
                            Volver al Inicio
                        </button>
                    </div>

                    <details className="mt-12 text-left max-w-2xl w-full">
                        <summary className="cursor-pointer text-gray-600 hover:text-gray-400 text-sm mb-2 list-none text-center">
                            Ver detalles técnicos (Para soporte)
                        </summary>
                        <div className="bg-black/50 p-6 rounded-xl border border-white/5 font-mono text-xs text-red-300 overflow-auto max-h-64 shadow-inner">
                            <strong className="block mb-2 text-red-400">{this.state.error?.toString()}</strong>
                            <div className="opacity-70 whitespace-pre-wrap">
                                {this.state.errorInfo?.componentStack}
                            </div>
                        </div>
                    </details>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
