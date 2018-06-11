import { Disposable } from "vscode";
import { StdIOService } from "../services/stdio_service";

export class PubTest extends StdIOService<{ type: string }> {
	constructor(pubPath: string, projectFolder: string, args: string[], logFile: string, envOverrides?: any) {
		super(() => logFile, true, true);

		this.createProcess(projectFolder, pubPath, ["run", "test", "-r", "json"].concat(args), envOverrides);
	}

	protected shouldHandleMessage(message: string): boolean {
		return (message.startsWith("{") && message.endsWith("}"));
	}
	protected isNotification(msg: any): boolean { return !!(msg.type || msg.event); }
	protected isResponse(msg: any): boolean { return false; }

	protected processUnhandledMessage(message: string): void {
		this.notify(this.unhandledMessageSubscriptions, message);
	}

	private unhandledMessageSubscriptions: Array<(notification: string) => void> = [];
	public registerForUnhandledMessages(subscriber: (notification: string) => void): Disposable {
		return this.subscribe(this.unhandledMessageSubscriptions, subscriber);
	}

	protected handleNotification(evt: any) {
		// console.log(JSON.stringify(evt));
		// Send all events to the editor.
		this.notify(this.allTestNotificationsSubscriptions, evt);
	}

	// Subscription lists.

	private allTestNotificationsSubscriptions: Array<(notification: any) => void> = [];

	// Subscription methods.

	public registerForAllTestNotifications(subscriber: (notification: { type: string }) => void): Disposable {
		return this.subscribe(this.allTestNotificationsSubscriptions, subscriber);
	}
}