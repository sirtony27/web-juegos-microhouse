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
                <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-8 font-mono">
                    <h1 className="text-3xl font-bold text-red-500 mb-4">Algo salió mal</h1>
                    <div className="bg-black/50 p-6 rounded-lg border border-red-500/30 max-w-4xl w-full overflow-auto">
                        <h2 className="text-xl font-bold mb-2 text-red-300">{this.state.error?.toString()}</h2>
                        <pre className="text-sm text-gray-400 whitespace-pre-wrap">
                            {this.state.errorInfo?.componentStack}
                        </pre>
                    </div>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-8 px-6 py-3 bg-blue-600 rounded-lg hover:bg-blue-700 font-bold"
                    >
                        Recargar Página
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
