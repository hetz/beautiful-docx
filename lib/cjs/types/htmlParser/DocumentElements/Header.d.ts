import { TextBlock } from './TextBlock';
import { HeadingLevel } from 'docx';
import { Element } from 'himalaya';
import { DocumentElementType } from './DocumentElement';
type DocxHeadingLevel = (typeof HeadingLevel)[keyof typeof HeadingLevel];
export declare class Header extends TextBlock {
    type: DocumentElementType;
    constructor(element: Element, level: DocxHeadingLevel);
}
export {};
//# sourceMappingURL=Header.d.ts.map