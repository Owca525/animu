import Button from '@renderer/components/buttons';
import { t } from 'i18next';
import React from 'react';

interface ErrorBoundaryProps {
    children: React.ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | undefined
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: undefined };
    }

    static getDerivedStateFromError(_error: Error) {
        return { hasError: true, error: _error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("Catched Error", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className='main-error-container'>
                    <div className="main-error-text">{t("globalError")}</div>
                    <div className="main-error-button-container">
                        <Button content={"Go Back To Home"} ButtonClass='error-button' onClick={() => window.location.href = `${window.location.origin}${window.location.pathname}`}/>
                        <Button content={"Leave Animu"} ButtonClass='error-button' onClick={() => window.BrowserWindow.exit()} />
                    </div>
                    {this.state.error && 
                        <div className="main-error-show">
                            Error Message: {this.state.error.message}
                        </div>
                    }
                </div>
            )
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
