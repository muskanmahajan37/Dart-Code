import * as vs from "vscode";
import { AnalysisGetSignatureResponse, ParameterInfo } from "../analysis/analysis_server_types";
import { Analyzer } from "../analysis/analyzer";
import { cleanDartdoc } from "../dartdocs";
import { fsPath } from "../utils";

export class DartSignatureHelpProvider implements vs.SignatureHelpProvider {
	constructor(private readonly analyzer: Analyzer) {
	}
	public async provideSignatureHelp(document: vs.TextDocument, position: vs.Position, token: vs.CancellationToken): Promise<vs.SignatureHelp> {
		try {
			const resp = await this.analyzer.analysisGetSignature({
				file: fsPath(document.uri),
				offset: document.offsetAt(position),
			});

			const sig = new vs.SignatureInformation(this.getSignatureLabel(resp), cleanDartdoc(resp.dartdoc));
			sig.parameters = resp.parameters.map((p) => new vs.ParameterInformation(this.getLabel(p)));

			const sigs = new vs.SignatureHelp();
			sigs.signatures = [sig];
			sigs.activeSignature = 0;
			// TODO: This isn't implemented in the server yet.
			sigs.activeParameter = -1; // resp.selectedParameterIndex;
			return sigs;
		} catch {
			return undefined;
		}
	}

	private getSignatureLabel(resp: AnalysisGetSignatureResponse): string {
		const req = resp.parameters.filter((p) => p.kind === "REQUIRED");
		const opt = resp.parameters.filter((p) => p.kind === "OPTIONAL");
		const named = resp.parameters.filter((p) => p.kind === "NAMED");
		const params = [];
		if (req.length)
			params.push(req.map(this.getLabel).join(", "));
		if (opt.length)
			params.push("[" + opt.map(this.getLabel).join(", ") + "]");
		if (named.length)
			params.push("{" + named.map(this.getLabel).join(", ") + "}");
		return `${resp.name}(${params.join(", ")})`;
	}

	private getLabel(p: ParameterInfo): string {
		return `${p.type} ${p.name}`;
	}
}