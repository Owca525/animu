import { createSignal, JSX, Show } from "solid-js";

let createGlobalError: (error: any) => void = () => { };

export function ErrorCreatorContext(props: { children: JSX.Element }) {
    const [error, setError] = createSignal()

    createGlobalError = (error) => setError(error)

    const makeError = () => { throw error() }

    return (
        <>
            {props.children}
            <Show when={error()}>
                {makeError()}
            </Show>
        </>
    );
}

export { createGlobalError };
