import { AlignmentType, Table, TableLayoutType, WidthType, TableRow as DocxTableRow } from 'docx';
import { Element, Styles } from 'himalaya';
import { DocxExportOptions } from '../../options';
import { AttributeMap, getAttributeMap, getPageWidth, parseStyles } from '../utils';
import { getTableIndent, parseBorderOptions } from './utils';
import { IText, TextBlock, TextType } from '../TextBlock';
import { TableRow } from './TableRow';

export class TableCreator implements IText {
  type: TextType = 'table';
  private attr: AttributeMap;
  private colGroup: Element | null = null;
  private children: TableRow[] = [];
  private styles: Styles;
  content: IText[];

  constructor(private element: Element, public exportOptions: DocxExportOptions) {
    this.attr = getAttributeMap(element.attributes);
    this.styles = parseStyles(this.attr['style']);

    this.createRows();

    this.content = [new TextBlock({ children: [] }), this, new TextBlock({ children: [] })];
  }

  transformToDocx() {
    return this.content.flatMap(i => {
      if (i.type === 'table') {
        return new Table({
          rows: this.children.flatMap(i => i.transformToDocx() as unknown as DocxTableRow),
          layout: TableLayoutType.FIXED,
          alignment: AlignmentType.CENTER,
          borders: this.borders,
          width: {
            size: this.width,
            type: WidthType.DXA,
          },
          indent: {
            size: getTableIndent(),
            type: WidthType.DXA,
          },
          columnWidths: this.columnWidth,
        });
      }
      return i.transformToDocx();
    });
  }

  private createRows() {
    this.children = [];
    for (const tableChild of this.element.children) {
      if (tableChild.type !== 'element') {
        continue;
      }
      // TODO: add support for tr, tfoot,
      switch (tableChild.tagName) {
        case 'thead':
          this.children.push(...this.parseTableRowsFragment(tableChild, true));
          break;
        case 'tbody':
          this.children.push(...this.parseTableRowsFragment(tableChild, false));
          break;
        case 'colgroup':
          this.setColGroup(tableChild);
          break;
        default:
          throw new Error(`Unsupported table element: ${tableChild.tagName}`);
      }
    }
    return this.children;
  }

  private parseTableRowsFragment(element: Element, isHeader: boolean) {
    const rows: TableRow[] = [];

    for (const child of element.children) {
      if (child.type !== 'element') {
        continue;
      }

      switch (child.tagName) {
        case 'tr':
          rows.push(...new TableRow(child, isHeader, this.exportOptions).getContent());
          break;
        default:
          throw new Error(`Unsupported table fragment element: ${child.tagName}`);
      }
    }

    return rows;
  }

  private setColGroup(colGroup: Element) {
    this.colGroup = colGroup;
  }

  getContent() {
    return this.content;
  }

  private get columnsCount() {
    return Math.max(...this.children.map(row => row.cellCount));
  }

  private get width() {
    const tableWidthTwip = getPageWidth(this.exportOptions);
    const tableAttr = getAttributeMap(this.element.attributes);
    const tableStyles = parseStyles(tableAttr['style']);
    const tableWidth = tableStyles['width'];

    if (tableWidth) {
      const widthPercent = parseFloat(tableWidth.slice(0, -1));

      return (tableWidthTwip * widthPercent) / 100;
    }

    return tableWidthTwip;
  }

  private get columnWidth() {
    if (this.colGroup?.children?.length === this.columnsCount) {
      return this.colGroup.children.map(item => {
        if (item.type === 'element' && item.tagName === 'col') {
          const colAttr = getAttributeMap(item.attributes);
          const colStyles = parseStyles(colAttr['style']);
          const widthPercent = parseFloat(colStyles['width'].slice(0, -1));

          return (this.width * widthPercent) / 100;
        }

        return Math.floor(this.width / this.columnsCount);
      });
    } else {
      const columnWidth = Math.floor(this.width / this.columnsCount);
      const columnWidths = new Array<number>(this.columnsCount).fill(columnWidth);

      return columnWidths;
    }
  }

  private get borders() {
    const borderOptions = parseBorderOptions(this.styles);

    return {
      top: borderOptions,
      bottom: borderOptions,
      left: borderOptions,
      right: borderOptions,
    };
  }
}
