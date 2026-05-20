import { BorderStyle, IBorderOptions } from 'docx';
import { Node, Styles } from 'himalaya';
type DocxBorderStyle = (typeof BorderStyle)[keyof typeof BorderStyle];
export declare const isInlineTextElement: (node: Node) => boolean;
export declare const parseBorderStyle: (style: string | undefined) => DocxBorderStyle;
export declare const parseBorderOptions: (styles: Styles) => IBorderOptions;
export declare const getTableIndent: () => number;
export {};
//# sourceMappingURL=utils.d.ts.map