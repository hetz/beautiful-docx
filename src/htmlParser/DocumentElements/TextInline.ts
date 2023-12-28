import { Element, Node, Attribute } from 'himalaya';
import { BorderStyle, ExternalHyperlink, IRunOptions, ParagraphChild, ShadingType, TextRun, UnderlineType } from 'docx';

import { cleanTextContent, getAttributeMap, parseStyles, supportHtmlTextContent } from '../utils';

import { InlineTextType, DocumentElement } from './DocumentElement';
import { ColorTranslator } from 'colortranslator';

const LINK_TEXT_COLOR = '2200CC';

export const supportedTextTypes: InlineTextType[] = [
  'br',
  'hr',
  'text',
  'strong',
  'i',
  'u',
  's',
  'del',
  'a',
  'b',
  'em',
  'span',
  'code',
  'sub',
  'sup',
];

const inlineTextOptionsDictionary: { [key in InlineTextType]: IRunOptions } = {
  br: { break: 1 },
  hr: {
    break: 1,
    text: '',
    underline: { type: UnderlineType.SINGLE },
  },
  text: {},
  strong: { bold: true },
  b: { bold: true },
  em: { italics: true },
  i: { italics: true },
  u: { underline: { type: UnderlineType.SINGLE } },
  s: { strike: true },
  del: { strike: true },
  a: {
    color: LINK_TEXT_COLOR,
    underline: { type: UnderlineType.SINGLE },
  },
  code: { border: { style: BorderStyle.SINGLE } },
  span: {},
  sup: { superScript: true },
  sub: { subScript: true },
};

export class TextInline implements DocumentElement {
  type: InlineTextType;
  content: (string | DocumentElement)[];
  isEmpty = false;

  constructor(private element: Node & { attributes?: [Attribute] }, public options: IRunOptions = {}) {
    if (this.element.type === 'text') {
      this.content = [this.element.content];
      this.type = 'text';
      this.isEmpty = this.element.content.trim() === '';
      return;
    }

    if (this.element.type !== 'element') {
      this.content = [];
      this.type = 'text';
      return;
    }

    if (!supportedTextTypes.includes(this.element.tagName as InlineTextType)) {
      throw new Error(`Unsupported ${this.element.tagName} tag`);
    }

    this.options = {
      color: this.textColor,
      shading: this.textShading,
      ...this.options,
      ...inlineTextOptionsDictionary[this.element.tagName as InlineTextType],
    };

    this.content = this.element.children.flatMap(i => {
      return new TextInline(i, this.options).getContent();
    });

    this.type = this.element.tagName as InlineTextType;
  }

  getContent() {
    return [this];
  }

  transformToDocx(): ParagraphChild[] {
    if (this.type === 'br' || this.type === 'hr') {
      return [new TextRun(this.options)];
    }

    return this.content.flatMap(content => {
      if (typeof content === 'string') {
        return [new TextRun({ text: supportHtmlTextContent(cleanTextContent(content)), ...this.options })];
      } else {
        /**
         *  TODO: support
         * <p><span class="slate-element-mention" data-uid="6bc4092e15064bb7a2700a03b685df2c" data-value="%7B%22name%22%3A%22%E7%BD%97%E6%B0%B8%E7%A4%BE%22%7D"></span> </p><p><span class="slate-element-relation-work-item" data-id="63c7ba8eb1f95b109c35533e" data-value="%7B%22sign%22%3A%22story%22%2C%22_id%22%3A%2263c7ba8eb1f95b109c35533e%22%2C%22name%22%3A%22%E9%80%89%E6%8B%A9%E5%95%86%E5%93%81%E7%B1%BB%E5%88%AB%E6%9F%A5%E7%9C%8B%22%2C%22application%22%3A70%2C%22color%22%3A%22%2330d1fc%22%2C%22icon%22%3A%22user-story-square-fill%22%2C%22type%22%3A%22story%22%2C%22group%22%3A1%2C%22identifier%22%3A%22DEMO-26%22%2C%22state_id%22%3A%2263c7ba8cb1f95b109c355236%22%2C%22pilot_id%22%3A%2263c7ba8db1f95b109c355304%22%7D"></span>
         **/
        // if (this.type === 'span') {
        // }
        if (this.type === 'a') {
          const element = this.element as Element;
          return [
            new ExternalHyperlink({
              link: element.attributes.find(item => item.key === 'href')?.value || '',
              children: element.children.flatMap(child =>
                new TextInline(child, {
                  ...this.options,
                }).transformToDocx()
              ),
            }),
          ];
        }
        return content.transformToDocx();
      }
    });
  }

  private get textColor() {
    if (!this.element.attributes) return undefined;
    const textAttr = getAttributeMap(this.element.attributes);
    const styles = parseStyles(textAttr['style']);
    const color = styles['color'];
    if (color) {
      const textColorTranslator = new ColorTranslator(color);
      return textColorTranslator.HEX;
    }
    return undefined;
  }
  private get textShading() {
    if (!this.element.attributes) return undefined;
    const textAttr = getAttributeMap(this.element.attributes);
    const styles = parseStyles(textAttr['style']);
    const backgroundColor = styles['background-color'];
    const color = styles['color'];
    if (backgroundColor || color) {
      const shading = {
        fill: 'auto',
        color: 'auto',
        type: ShadingType.CLEAR,
      };
      if (backgroundColor) {
        const backgroundColorTranslator = new ColorTranslator(backgroundColor);
        shading.fill = backgroundColorTranslator.HEX;
      }
      if (color) {
        const textColorTranslator = new ColorTranslator(color);
        shading.color = textColorTranslator.HEX;
      }
      return shading;
    }
    return undefined;
  }
}
