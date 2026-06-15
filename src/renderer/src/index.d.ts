declare global {
  declare module "solid-js" {
    namespace JSX {
      interface IntrinsicElements { 
        'sheep-img': {
            src?: string,
            class?: string,
            divClass?: string,
            alt?: string,
            onClick?: (ev: PointerEvent) => void
            onLoad?: (ev: Event) => void
            onError?: (ev: string | Event) => void
        };
      }
    }
  }
}