import { BorderStyle, convertMillimetersToTwip, IParagraphOptions } from 'docx';
import { Element, Node } from 'himalaya';
import { TextInline } from './TextInline';
import { TextBlock } from './TextBlock';
import { parseTextAlignment } from './utils';

const BLOCKQUOTE_SIZE = 25;
const BLOCKQUOTE_COLOR = '#cccccc';
const BLOCKQUOTE_SPACE = 12;

export class Blockquote extends TextBlock {
  constructor(node: Node, parent: Element) {
    const options: IParagraphOptions = {
      alignment: parseTextAlignment(parent.attributes),
      children:
        node.type === 'element'
          ? node.children.flatMap(child =>
              new TextInline(child, {
                italics: true,
              }).getContent()
            )
          : new TextInline(node).getContent(),
      border: {
        left: { style: BorderStyle.SINGLE, size: BLOCKQUOTE_SIZE, color: BLOCKQUOTE_COLOR, space: BLOCKQUOTE_SPACE },
      },
      indent: { left: convertMillimetersToTwip(6) },
    };

    super(options);
  }
}
