import { Element, Node } from 'himalaya';
import { DocxExportOptions } from '../options';
export declare class HtmlParser {
    options: DocxExportOptions;
    constructor(options: DocxExportOptions);
    parse(content: string): Promise<any>;
    setImages(content: Node[]): Promise<void>;
    parseHtmlTree(root: Node[], parentTag: string): any;
    parseTopLevelElement: (element: Element, parentTag: string, pIndex: number) => any;
    private coverWithFigure;
}
//# sourceMappingURL=HtmlParser.d.ts.map