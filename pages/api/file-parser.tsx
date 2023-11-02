import { NextApiRequest, NextApiResponse } from 'next';
import multer from 'multer';
import mammoth from 'mammoth';
import { getDocument } from 'pdfjs-dist';

interface NextApiRequestWithFiles extends NextApiRequest {
  files: Express.Multer.File[];
}

const upload = multer({ storage: multer.memoryStorage() });

export const config = {
  api: {
    bodyParser: false,
  },
};

const processPDF = async (fileBuffer: Buffer): Promise<string> => {
  const uint8Array = new Uint8Array(fileBuffer.buffer);
  const loadingTask = getDocument({ data: uint8Array });
  const pdf = await loadingTask.promise;

  let text = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map(item => 'str' in item ? item.str : '').join(' ');
  }
  return text;
};

const handleFileContent = async (fileBuffer: Buffer, fileType: string, fileName: string): Promise<string> => {
  if (fileType === 'application/pdf') {
    return await processPDF(fileBuffer);
  } else if (fileType === 'text/plain' || ['application/xml', 'text/xml', 'text/html'].includes(fileType) || fileName.endsWith('.md') || fileName.endsWith('.mdx') || fileType === 'application/rtf') {
    return fileBuffer.toString('utf-8');
  } else if (fileType === 'application/json') {
    const content = JSON.parse(fileBuffer.toString('utf-8'));
    return JSON.stringify(content, null, 2);
  } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    try {
      const result = await mammoth.extractRawText({ buffer: fileBuffer });
      return result.value;
    } catch (err) {
      console.error('Error processing DOCX file:', err);
      throw new Error('Error processing DOCX file');
    }
  } else if (fileType === 'application/vnd.oasis.opendocument.text') {
    throw new Error("Processing .odt files is not supported currently.");
  }

  return '';
};

export default async (req: NextApiRequestWithFiles, res: NextApiResponse) => {
  console.log("parse-here");
  await new Promise((resolve, reject) => {
    upload.array('files')(req as any, res as any, (err) => {
      if (err) {
        return reject(err);
      }
      resolve(null);
    });
  });

  const files = req.files as Express.Multer.File[];
  const results: string[] = [];

  for (const file of files) {
    const content = await handleFileContent(file.buffer, file.mimetype, file.originalname);
    results.push(content);
  }

  res.json({ files: results });
};
