/* eslint-disable @typescript-eslint/no-explicit-any */
/* istanbul ignore file */
/**

node -r ts-node/register/transpile-only ./exampleEach.ts --html=./exprot_project_20241206_100833.html
 */
import { DocxGenerator } from '../src';
import path from 'path';
import * as fs from 'fs';
import { AlignmentType, NumberFormat } from 'docx';
import { PageFormat } from '../src/options';

(async (options: any) => {
  const dryRun = options.dryRun == 'false' ? false : true;
  if (options.html == null) {
    console.log('html 必须有值');
    process.exit(2);
  }
  console.time('Loading');

  const docxGeneratorOpt = {
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
  };
  const docxGenerator = new DocxGenerator(docxGeneratorOpt);
  const HTML = fs.readFileSync(path.join(__dirname, options.html), 'utf8');

  // Split HTML by <h1> tag</h1>
  const regexReplaceTitle = new RegExp('<h1 style="text-align: center;">(.*?)导出</h1>', 'g');
  const HTMLArr = HTML.replace(regexReplaceTitle, '').split('<h1>');
  console.log(`Total count: ${HTMLArr.length}`);
  for await (const [index, html] of HTMLArr.entries()) {
    console.time(`Loading-${index}, length: ${html.length}`);
    try {
      const buffer = await docxGenerator.generateDocx(`<h1>${html}`);
      console.timeEnd(`Loading-${index}, length: ${html.length}`);
      fs.writeFileSync(path.join(__dirname, `${options.html.replace('.html', '_' + index + '.docx')}`), buffer);
    } catch (error) {
      console.error(html);
      console.log(JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    }
  }

  process.exit(0);
})(
  process.argv
    .slice(2)
    .map(x => {
      return x
        .trim()
        .split(/(--\b\w*[a-z-]\w*\b=)/gim)
        .slice(1, 9999);
    })
    .reduce((obj, [key, val]) => {
      const humpKey = key
        .replace('--', '')
        .replace('=', '')
        .replace(/-(\w)/g, (_, c) => (c ? c.toUpperCase() : ''));
      obj[humpKey] = val;
      return obj;
    }, {})
);
