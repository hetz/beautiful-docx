/* istanbul ignore file */
import { DocxGenerator } from '../src';
import path from 'path';
import * as fs from 'fs';
import { exampleText } from './exampleText';
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
  const HTMLArr = HTML.replace('<h1 style="text-align: center;">项目管理导出</h1>', '').split('<h1>');
  console.log(`Total count: ${HTMLArr.length}`);
  for await (const [index, html] of HTMLArr.entries()) {
    // if (![8, 53, 58, 106, 127, 131, 132, 133, 134, 136, 137, 138, 142, 146, 148, 155, 161, 166, 168].includes(index))
    //   continue;
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
