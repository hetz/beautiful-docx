import { Paragraph } from 'docx';

import { Node } from 'himalaya';
import { TextInline } from './TextInline';
import { List } from './List';
import { TextBlock } from './TextBlock';
import { isListTag, parseTextAlignment } from '../utils';
import { DocumentElement, DocumentElementType } from './DocumentElement';
import { isInlineTextElement } from './Table/utils';
import { HtmlParser } from '../HtmlParser';
import { DocxExportOptions, IParagraphOptions } from '../../options';

export class ListItem extends TextBlock {
  type: DocumentElementType = 'list-item';
  private readonly nestedElements: DocumentElement[] = [];

  constructor(element: Node, options: IParagraphOptions, level: number, exportOptions: DocxExportOptions) {
    if (!(element.type === 'element')) {
      throw new Error(`The child of list should be list item. Type: ${element.type}`);
    }
    if (!(element.tagName === 'li')) {
      // throw new Error(
      console.error(`The element tagName: ${element.tagName}, ElementObj: ${JSON.stringify(element)}`);
    }

    const liOptions: IParagraphOptions = {
      ...options,
      alignment: parseTextAlignment(element.attributes),
    };

    const children: DocumentElement[] = [];
    const nestedElements: DocumentElement[] = [];

    element.children.forEach(child => {
      if (isInlineTextElement(child)) {
        children.push(...new TextInline(child).getContent());
        return;
      }
      //# region 特殊处理 li 中的 p 标签
      if (
        child.type === 'element' &&
        child.tagName === 'p' &&
        child.children.map(x => isInlineTextElement(x)).filter(x => !x).length == 0
      ) {
        child.children.forEach(x => {
          children.push(...new TextInline(x).getContent());
        });
        return;
      }
      //#endregion
      if (child.type === 'element' && isListTag(child.tagName)) {
        nestedElements.push(...new List(child, level + 1, exportOptions).getContent());
        return;
      }

      nestedElements.push(...new HtmlParser(exportOptions).parseHtmlTree([child], 'li'));
    });
    super(liOptions, children);
    this.nestedElements = nestedElements;
  }

  getContent(): DocumentElement[] {
    return [this];
  }

  transformToDocx() {
    return [
      new Paragraph({
        ...this.options,
        children: this.children.flatMap(i => i.transformToDocx()),
      }),
      ...this.nestedElements.flatMap(i => i.transformToDocx() as Paragraph[]),
    ];
  }
}
