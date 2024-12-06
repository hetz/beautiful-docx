import v8 from 'v8';
import { HeadingLevel } from 'docx';
import { Element, Node, parse } from 'himalaya';
import { DocxExportOptions } from '../options';
import {
  Blockquote,
  DocumentElement,
  Figure,
  Header,
  Image,
  List,
  PageBreak,
  Paragraph,
  TableCreator,
  TextBlock,
  TextInline,
} from './DocumentElements';

import { ImagesAdapter } from './ImagesAdapter';
import { TableOfContents } from './DocumentElements/TableOfContents';

import { JSDOM } from 'jsdom';
import DOMPurify from 'dompurify';
const window = new JSDOM('').window;
const purify = DOMPurify(window);

export class HtmlParser {
  constructor(public options: DocxExportOptions) { }

  async parse(content: string, cut = '<page-break />') {
    if (typeof global.gc === 'function') {
      const memUsage = process.memoryUsage();
      const rss = memUsage.rss / 1024 / 1024;
      console.log('parsedContent before memoryUsage:', rss.toFixed(2));
      global.gc();
    }
    const purifyContent = await this.splitHtmlByRootElement(content, cut);
    const parsedContent = parse(purifyContent);
    // const parsedContent = parse(content);
    if (typeof global.gc === 'function') {
      global.gc();
      const memUsage = process.memoryUsage();
      const rss = memUsage.rss / 1024 / 1024;
      console.log('parsedContent gc after memoryUsage:', rss.toFixed(2));
    }
    await this.setImages(parsedContent);

    return this.parseHtmlTree(parsedContent, '');
  }

  async setImages(content: Node[]) {
    const images = await new ImagesAdapter(this.options.images).downloadImages(content);
    this.options = { ...this.options, images };
  }
  async splitHtmlByRootElement(html: string, cut: string) {
    const rootElements: string[] = [];

    const htmlArr = html.split(cut).map(function (x) {
      return `${x}${cut}`;
    });

    const htmlArrLength = htmlArr.length;
    let domIndex = 0;
    for (const element of htmlArr) {
      domIndex++;
      console.log(
        `splitHtmlByRootElement domArr: ${domIndex}/${htmlArrLength}, ${Math.floor((domIndex / htmlArrLength) * 100)}% `
      );
      if (typeof global.gc === 'function') {
        const MB = 1024 * 1024;
        const maxMemo = (v8.getHeapStatistics().heap_size_limit / MB).toFixed(2);
        const memUsage = process.memoryUsage();
        const rss = (memUsage.rss / MB).toFixed(2);
        const costMemo = Math.floor(parseInt(rss) / parseInt(maxMemo)) * 100;
        console.log(`Memory:  ${rss}/${maxMemo}MB ${costMemo}%`);
        if (costMemo > 95) {
          console.log(`Memory is too high, GC.`);
          global.gc();
        }
      }
      rootElements.push(purify.sanitize(element));
    }
    return rootElements.join('');
  }

  parseHtmlTree(root: Node[], parentTag: string) {
    const paragraphs: DocumentElement[] | any = [];
    let pCounts = 0;

    for (const child of root) {
      switch (child.type) {
        case 'text': {
          paragraphs.push(...new TextBlock({}, new TextInline(child).getContent()).getContent());
          break;
        }
        case 'element': {
          const topLevelElement = this.parseTopLevelElement(child, parentTag, pCounts);
          paragraphs.push(...topLevelElement);

          if (child.tagName === 'p') {
            pCounts++;
          }
          break;
        }
      }
    }

    return paragraphs;
  }

  parseTopLevelElement = (element: Element, parentTag: string, pIndex: number) => {
    switch (element.tagName) {
      case 'html':
      case 'body':
      case 'header':
      case 'nav':
      case 'main':
      case 'aside':
      case 'footer':
      case 'div':
      case 'article':
      case 'section':
      case 'pre': {
        return this.parseHtmlTree(element.children, parentTag);
      }
      case 'p': {
        return new Paragraph(element, pIndex, this.options).getContent();
      }
      case 'tr':
      case 'td': {
        return '';
      }
      case 'hr':
      case 'br': {
        return new TextBlock({}, new TextInline(element).getContent()).getContent();
      }
      case 'code':
      case 'strong':
      case 'b':
      case 'i':
      case 'em':
      case 'u':
      case 'del':
      case 's':
      case 'span':
      case 'sup':
      case 'sub': {
        return new TextBlock({}, new TextInline(element).getContent()).getContent();
      }
      case 'h1': {
        return new Header(element, HeadingLevel.HEADING_1).getContent();
      }
      case 'h2': {
        return new Header(element, HeadingLevel.HEADING_2).getContent();
      }
      case 'h3': {
        return new Header(element, HeadingLevel.HEADING_3).getContent();
      }
      case 'h4': {
        return new Header(element, HeadingLevel.HEADING_4).getContent();
      }
      case 'h5': {
        return new Header(element, HeadingLevel.HEADING_5).getContent();
      }
      case 'h6': {
        return new Header(element, HeadingLevel.HEADING_6).getContent();
      }
      case 'ul':
      case 'ol': {
        return new List(element, 0, this.options).getContent();
      }
      case 'figure': {
        return new Figure(element, this.options).getContent();
      }
      case 'table': {
        return new TableCreator(element, parentTag, this.options).getContent();
      }
      case 'img': {
        return new Image(this.coverWithFigure(element), parentTag, this.options).getContent();
      }
      case 'blockquote': {
        return new Blockquote(element).getContent();
      }
      case 'page-break': {
        return new PageBreak().getContent();
      }
      case 'table-of-contents': {
        return new TableOfContents().getContent();
      }
      default: {
        console.error(`Unsupported top tag ${element.tagName}`);
        return '';
        // throw new Error(`Unsupported top tag ${element.tagName}`);
      }
    }
  };

  private coverWithFigure(node: Node) {
    const figureHtml = `<figure></figure>`;
    const element = parse(figureHtml).find(i => i.type === 'element' && i.tagName === 'figure') as Element;
    element.children = [node];
    return element;
  }
}
