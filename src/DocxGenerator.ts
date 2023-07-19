import { Packer } from 'docx';
import { DocumentBuilder } from './DocumentBuilder';
import { HtmlParser } from './htmlParser';
import merge from 'ts-deepmerge';

import { defaultExportOptions, DocxExportOptions, userOptionsSchema } from './options';
import { DeepPartial } from './utils';

export class DocxGenerator {
  public readonly options: DocxExportOptions;
  private parser: HtmlParser;
  private builder: DocumentBuilder;

  constructor(docxExportOptions?: DeepPartial<DocxExportOptions>) {
    if (docxExportOptions === undefined) {
      this.options = defaultExportOptions;
    } else {
      userOptionsSchema.parse(docxExportOptions);

      this.options = merge(defaultExportOptions, docxExportOptions);
    }

    this.parser = new HtmlParser(this.options);
    this.builder = new DocumentBuilder(this.options);
  }

  public async generateDocx(html: string): Promise<Buffer> {
    const documentContent = await this.parser.parse(this.parseHtml(html));
    const doc = this.builder.build(documentContent);

    return await Packer.toBuffer(doc);
  }
  private parseHtml(html: string) {
    // eslint-disable-next-line no-control-regex, no-irregular-whitespace
    const reSpecialCharacters = /(||||﻿|||)/g;
    // eslint-disable-next-line no-control-regex
    const spaceCharacters = /(\x08|\x02)/g;
    // eslint-disable-next-line no-irregular-whitespace
    return html.replace(reSpecialCharacters, '').replace(spaceCharacters, ' ').replace(/ /g, ' ');
  }
}
