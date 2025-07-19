import Button from '@renderer/components/buttons';
import { t } from 'i18next';
import React from 'react';

interface ErrorBoundaryProps {
    children: React.ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
}
// TODO: Improve Error Boundary 
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(_error: Error) {
        return { hasError: true };
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
                        <Button content={t("dialog.yes")} onClick={() => window.location.href = `${window.location.origin}${window.location.pathname}`}/>
                        <Button content={t("dialog.no")} onClick={window.BrowserWindow.exit} />
                    </div>
                </div>
            )
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
