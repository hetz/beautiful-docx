/* istanbul ignore file */
import { DocxGenerator } from '../src';
import path from 'path';
import * as fs from 'fs';
import { AlignmentType, NumberFormat } from 'docx';
import { PageFormat } from '../src/options';

const docxGenerator = new DocxGenerator({
  page: {
    size: { width: 8.3, height: 11.7 },
    numbering: { type: NumberFormat.DECIMAL, align: AlignmentType.END },
    margins: {
      top: 16,
      left: 12,
      right: 12,
      bottom: 12,
    },
  },
  font: {
    baseFontFamily: 'Times New Roman',
    headersFontFamily: '宋体',
    baseSize: 9,
    headersSizes: {
      h1: 16,
      h2: 14,
      h3: 12,
    },
  },
  ignoreIndentation: true,
  verticalSpaces: 1.15,
});

const main = async () => {
  const HTML = fs.readFileSync(path.join(__dirname, 'example.html'), 'utf8');
  const regexReplaceTitle = new RegExp('<h1 style="text-align: center;">(.*?)导出</h1>', 'g');
  const HTMLArr = HTML.replace(regexReplaceTitle, '').split('<h1>');
  console.log(`Total count: ${HTMLArr.length}`);
  for await (const [index, html] of HTMLArr.entries()) {
    console.time('Loading-' + index);
    try {
      const buffer = await docxGenerator.generateDocx(`<h1>${html}`);
      console.timeEnd('Loading-' + index);
      fs.writeFileSync(`test-lib-${index}.docx`, buffer);
    } catch (error) {
      console.error(html);
      console.log(JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    }
  }
};

void main();
