import { HtmlToDocx } from '.';
import { exampleText } from './exampleText';
import { defaultExportOptions } from './options';

describe('HtmlToDocx', () => {
  test('should return buffer', async () => {
    const htmlToDocx = new HtmlToDocx({
      page: {
        size: {
          width: 5.5,
          height: 8,
        },
      },
      font: {
        baseFontFamily: 'Calibri',
        headersFontFamily: 'Calibri',
      },
      verticalSpaces: 0,
    });
    const buffer = await htmlToDocx.generateDocx(exampleText);

    expect(buffer).toBeInstanceOf(Buffer);
  });

  test('should be created with default options without users options', () => {
    const instance = new HtmlToDocx();

    expect(instance.options).toBeDefined();
    expect(instance.options).toStrictEqual(defaultExportOptions);
  });
});
