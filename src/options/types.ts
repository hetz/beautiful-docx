import { Mutable } from '../htmlParser/utils';
import { IParagraphOptions as ParagraphOptions } from 'docx';

export type ImageMap = {
  [url: string]: Buffer;
};

// TODO: support cm and inches for length
type LengthUnit = number;

type FontSize = number;

export enum PageOrientation {
  Portrait = 'portrait',
  Landscape = 'landscape',
}

export type PageFormatType = 'A3' | 'A4' | 'A5' | 'A6';

export type PageSize = {
  width: LengthUnit;
  height: LengthUnit;
};

export type PageFormatSizes = { [x in PageFormatType]: PageSize };

export type PageOptions = {
  // add support
  orientation: PageOrientation;
  size: PageSize;
  margins: {
    top: LengthUnit;
    right: LengthUnit;
    bottom: LengthUnit;
    left: LengthUnit;
  };
  numbering: boolean;
};

export type FontOptions = {
  baseSize: FontSize;
  baseFontFamily: string;
  headersFontFamily: string;
  headersSizes: {
    h1: FontSize;
    h2: FontSize;
    h3: FontSize;
    h4: FontSize;
  };
};

export type DocxExportOptions = {
  page: PageOptions;
  font: FontOptions;
  verticalSpaces: number;
  ignoreIndentation?: boolean;
  images?: ImageMap;
  table: TableOptions;
};

export type TableOptions = {
  cellPaddings: {
    left: number;
    right: number;
    top: number;
    bottom: number;
  };
};

export type IParagraphOptions = Mutable<ParagraphOptions>;
