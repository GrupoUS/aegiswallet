export interface NetworkInformation {
	effectiveType?: string;
	downlink?: number;
	rtt?: number;
	saveData?: boolean;
	addEventListener?: (type: string, listener: EventListener) => void;
	removeEventListener?: (type: string, listener: EventListener) => void;
}

export interface BatteryManager {
	charging: boolean;
	chargingTime: number;
	dischargingTime: number;
	level: number;
	addEventListener: (type: string, listener: EventListener) => void;
	removeEventListener: (type: string, listener: EventListener) => void;
}

export interface NavigatorWithExtensions extends Navigator {
	connection?: NetworkInformation;
	mozConnection?: NetworkInformation;
	webkitConnection?: NetworkInformation;
	deviceMemory?: number;
	getBattery?: () => Promise<BatteryManager>;
	// For completeness with what was seen in the file
	msMaxTouchPoints?: number;
}

export interface WindowWithExtensions extends Window {
	webkitAudioContext?: typeof AudioContext;
}
