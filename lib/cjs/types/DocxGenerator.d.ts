import { DocxExportOptions } from './options';
import { DeepPartial } from './utils';
export declare class DocxGenerator {
    readonly options: DocxExportOptions;
    private parser;
    private builder;
    constructor(docxExportOptions?: DeepPartial<DocxExportOptions>);
    generateDocx(html: string): Promise<Buffer>;
    private parseHtml;
}
//# sourceMappingURL=DocxGenerator.d.ts.map