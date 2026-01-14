---
name: office-documents
description: Create and edit Microsoft Office documents (Word, Excel, PowerPoint) using Node.js libraries. Provides templates and code patterns for generating .docx, .xlsx, and .pptx files programmatically.
keywords: word, excel, powerpoint, document, spreadsheet, presentation, docx, xlsx, pptx
triggers: create document, write document, generate report, make spreadsheet, create presentation
---

# Office Documents Skill

Create professional Microsoft Office documents programmatically using Node.js libraries.

## When to Use This Skill

- Creating Word documents (.docx)
- Generating Excel spreadsheets (.xlsx)
- Building PowerPoint presentations (.pptx)
- Automating report generation
- Creating document templates
- Batch document creation

---

## Quick Start

### Required Libraries

```bash
# Install document creation libraries
npm install docx xlsx pptxgenjs
```

---

## Word Documents (.docx)

Use the `docx` library for creating Word documents.

### Basic Word Document

```typescript
import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell } from 'docx';
import { writeFileSync } from 'fs';

// Create a simple document
const doc = new Document({
  sections: [{
    properties: {},
    children: [
      new Paragraph({
        text: "My Document Title",
        heading: HeadingLevel.TITLE,
      }),
      new Paragraph({
        children: [
          new TextRun("Hello World!"),
          new TextRun({
            text: " This is bold.",
            bold: true,
          }),
        ],
      }),
    ],
  }],
});

// Save the document
const buffer = await Packer.toBuffer(doc);
writeFileSync("document.docx", buffer);
```

### Word Document with Table

```typescript
const doc = new Document({
  sections: [{
    children: [
      new Table({
        rows: [
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph("Header 1")] }),
              new TableCell({ children: [new Paragraph("Header 2")] }),
            ],
          }),
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph("Cell 1")] }),
              new TableCell({ children: [new Paragraph("Cell 2")] }),
            ],
          }),
        ],
      }),
    ],
  }],
});
```

### Word Document with Styles

```typescript
const doc = new Document({
  styles: {
    paragraphStyles: [{
      id: "customStyle",
      name: "Custom Style",
      run: { font: "Calibri", size: 28, color: "333333" },
      paragraph: { spacing: { after: 200 } },
    }],
  },
  sections: [{
    children: [
      new Paragraph({
        text: "Styled paragraph",
        style: "customStyle",
      }),
    ],
  }],
});
```

---

## Excel Spreadsheets (.xlsx)

Use the `xlsx` library for creating Excel files.

### Basic Excel Spreadsheet

```typescript
import * as XLSX from 'xlsx';

// Create workbook and worksheet
const workbook = XLSX.utils.book_new();
const data = [
  ["Name", "Age", "City"],
  ["Alice", 30, "New York"],
  ["Bob", 25, "Los Angeles"],
  ["Charlie", 35, "Chicago"],
];

const worksheet = XLSX.utils.aoa_to_sheet(data);
XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

// Save the file
XLSX.writeFile(workbook, "spreadsheet.xlsx");
```

### Excel from JSON Data

```typescript
const jsonData = [
  { name: "Alice", age: 30, city: "New York" },
  { name: "Bob", age: 25, city: "Los Angeles" },
];

const worksheet = XLSX.utils.json_to_sheet(jsonData);
const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
XLSX.writeFile(workbook, "from-json.xlsx");
```

### Excel with Column Widths

```typescript
const worksheet = XLSX.utils.aoa_to_sheet(data);

// Set column widths
worksheet['!cols'] = [
  { wch: 20 }, // Column A width
  { wch: 10 }, // Column B width
  { wch: 15 }, // Column C width
];

const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
XLSX.writeFile(workbook, "styled.xlsx");
```

---

## PowerPoint Presentations (.pptx)

Use `pptxgenjs` for creating PowerPoint presentations.

### Basic PowerPoint

```typescript
import PptxGenJS from 'pptxgenjs';

const pptx = new PptxGenJS();

// Title slide
const slide1 = pptx.addSlide();
slide1.addText("My Presentation", {
  x: 1, y: 2, w: "80%",
  fontSize: 36, bold: true,
  color: "363636",
  align: "center",
});

// Content slide
const slide2 = pptx.addSlide();
slide2.addText("Key Points", {
  x: 0.5, y: 0.5, w: "90%",
  fontSize: 24, bold: true,
});
slide2.addText([
  { text: "Point 1: Introduction", options: { bullet: true } },
  { text: "Point 2: Main Content", options: { bullet: true } },
  { text: "Point 3: Conclusion", options: { bullet: true } },
], { x: 0.5, y: 1.5, w: "90%", fontSize: 18 });

// Save
pptx.writeFile({ fileName: "presentation.pptx" });
```

### PowerPoint with Images

```typescript
const slide = pptx.addSlide();

// Add image from file
slide.addImage({
  path: "./image.png",
  x: 1, y: 1, w: 4, h: 3,
});

// Add image from base64
slide.addImage({
  data: "data:image/png;base64,...",
  x: 6, y: 1, w: 3, h: 2,
});
```

### PowerPoint with Charts

```typescript
const slide = pptx.addSlide();

slide.addChart(pptx.ChartType.bar, [
  {
    name: "Sales",
    labels: ["Q1", "Q2", "Q3", "Q4"],
    values: [100, 200, 300, 400],
  },
], {
  x: 1, y: 1, w: 8, h: 4,
  title: "Quarterly Sales",
  showLegend: true,
});
```

---

## Complete Example: Report Generator

```typescript
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import * as XLSX from 'xlsx';
import PptxGenJS from 'pptxgenjs';
import { writeFileSync } from 'fs';

interface ReportData {
  title: string;
  summary: string;
  metrics: { name: string; value: number }[];
}

async function generateReport(data: ReportData, outputDir: string) {
  // 1. Create Word Report
  const doc = new Document({
    sections: [{
      children: [
        new Paragraph({ text: data.title, heading: HeadingLevel.TITLE }),
        new Paragraph({ text: data.summary }),
        new Paragraph({ text: "Metrics", heading: HeadingLevel.HEADING_1 }),
        ...data.metrics.map(m =>
          new Paragraph({ text: `${m.name}: ${m.value}` })
        ),
      ],
    }],
  });
  writeFileSync(`${outputDir}/report.docx`, await Packer.toBuffer(doc));

  // 2. Create Excel Data
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data.metrics);
  XLSX.utils.book_append_sheet(wb, ws, "Metrics");
  XLSX.writeFile(wb, `${outputDir}/data.xlsx`);

  // 3. Create PowerPoint Summary
  const pptx = new PptxGenJS();
  const slide = pptx.addSlide();
  slide.addText(data.title, { x: 1, y: 1, fontSize: 36, bold: true });
  slide.addText(data.summary, { x: 1, y: 2, fontSize: 18 });
  slide.addChart(pptx.ChartType.bar, [{
    name: "Metrics",
    labels: data.metrics.map(m => m.name),
    values: data.metrics.map(m => m.value),
  }], { x: 0.5, y: 3, w: 9, h: 4 });
  await pptx.writeFile({ fileName: `${outputDir}/summary.pptx` });

  console.log("Report generated successfully!");
}

// Usage
generateReport({
  title: "Q4 2024 Report",
  summary: "This quarter showed strong growth across all metrics.",
  metrics: [
    { name: "Revenue", value: 1200000 },
    { name: "Users", value: 50000 },
    { name: "Engagement", value: 85 },
  ],
}, "./output");
```

---

## Tips

1. **Memory Management**: For large documents, use streaming APIs when available
2. **Templates**: Consider creating reusable template functions for consistent styling
3. **Error Handling**: Always wrap file operations in try-catch blocks
4. **Testing**: Test generated documents by opening them in the actual Office applications
5. **Cross-Platform**: These libraries work on Windows, macOS, and Linux
