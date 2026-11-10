/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_TICKETBOOT_BACKEND_ENABLED?: string;
}

declare module "*.png" {
	const source: string;
	export default source;
}

declare module "*.css";
