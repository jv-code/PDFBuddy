const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { PDFDocument } = require('pdf-lib');
const fs = require('fs').promises;
const compress_pdf = require('compress-pdf');
const path = require('path');

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const storage = multer.memoryStorage();
const upload = multer({ storage });

const parseRanges = (ranges) => {
  const pages = new Set();
  if (!ranges) return [];

  const parts = ranges.split(',');
  for (const part of parts) {
    if (part.includes('-')) {
      const [start, end] = part.split('-').map(num => parseInt(num.trim(), 10));
      if (!isNaN(start) && !isNaN(end)) {
        for (let i = start; i <= end; i++) {
          pages.add(i - 1); // pdf-lib is 0-indexed
        }
      }
    } else {
      const page = parseInt(part.trim(), 10);
      if (!isNaN(page)) {
        pages.add(page - 1); // pdf-lib is 0-indexed
      }
    }
  }
  return Array.from(pages).sort((a, b) => a - b);
};

app.post('/split', upload.single('file'), async (req, res) => {
  try {
    const { ranges } = req.body;
    if (!req.file) {
      return res.status(400).send('No file uploaded.');
    }
    if (!ranges) {
      return res.status(400).send('No split ranges provided.');
    }

    const pagesToExtract = parseRanges(ranges);
    const pdf = await PDFDocument.load(req.file.buffer);

    if (pagesToExtract.some(p => p < 0 || p >= pdf.getPageCount())) {
      return res.status(400).send('Invalid page number provided.');
    }

    const newPdf = await PDFDocument.create();
    const copiedPages = await newPdf.copyPages(pdf, pagesToExtract);
    copiedPages.forEach(page => newPdf.addPage(page));

    const newPdfBytes = await newPdf.save();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=split.pdf');
    res.send(Buffer.from(newPdfBytes));

  } catch (error) {
    console.error('Error splitting PDF:', error);
    res.status(500).send('An error occurred while splitting the PDF.');
  }
});

app.post('/compress', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }

  const inputPath = path.join(__dirname, 'uploads', req.file.originalname);
  const outputPath = path.join(__dirname, 'compressed');

  try {
    // Ensure directories exist
    await fs.mkdir(path.join(__dirname, 'uploads'), { recursive: true });
    await fs.mkdir(outputPath, { recursive: true });

    await fs.writeFile(inputPath, req.file.buffer);

    await compress_pdf.compress(inputPath, outputPath);

    const compressedFilePath = path.join(outputPath, path.basename(inputPath));
    const compressedFileBuffer = await fs.readFile(compressedFilePath);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=compressed_${req.file.originalname}`);
    res.send(compressedFileBuffer);

  } catch (error) {
    console.error('Error compressing PDF:', error);
    // Check for Ghostscript error
    if (error.toString().includes('Could not find GhostScript')) {
        return res.status(500).send('Ghostscript is not installed or not in your PATH. Please install it to use the compression feature.');
    }
    res.status(500).send('An error occurred while compressing the PDF.');
  } finally {
    // Clean up uploaded and compressed files
    try {
      await fs.unlink(inputPath);
      await fs.unlink(path.join(outputPath, path.basename(inputPath)));
    } catch (cleanupError) {
      console.error('Error during cleanup:', cleanupError);
    }
  }
});

app.post('/merge', upload.array('files'), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).send('No files uploaded.');
    }

    const mergedPdf = await PDFDocument.create();

    for (const file of req.files) {
      const pdf = await PDFDocument.load(file.buffer);
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      copiedPages.forEach((page) => {
        mergedPdf.addPage(page);
      });
    }

    const mergedPdfBytes = await mergedPdf.save();
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=merged.pdf');
    res.send(Buffer.from(mergedPdfBytes));

  } catch (error) {
    console.error('Error merging PDFs:', error);
    res.status(500).send('An error occurred while merging the PDFs.');
  }
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
