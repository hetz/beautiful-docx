/* eslint-disable @typescript-eslint/no-explicit-any */
import { DocxGenerator } from '../src';
// import { DocxGenerator } from 'beautiful-docx';
import path from 'path';
import * as fs from 'fs';
import { AlignmentType, NumberFormat } from 'docx';

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
  const HTML = fs.readFileSync(path.join(options.html), 'utf8');
  const buffer = await docxGenerator.generateDocx(HTML);
  console.timeEnd('Loading');
  fs.writeFileSync(path.join(__dirname, options.html.replace('.html', '.docx')), buffer);

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

node -r ts-node/register/transpile-only
