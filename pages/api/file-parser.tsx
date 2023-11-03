import { NextApiRequest, NextApiResponse } from 'next';
import multer from 'multer';
import { getTextExtractor } from 'office-text-extractor';

interface NextApiRequestWithFiles extends NextApiRequest {
  files: Express.Multer.File[];
}

const upload = multer({ storage: multer.memoryStorage() });

export const config = {
  api: {
    bodyParser: false,
  },
};

const extractor = getTextExtractor();

const handleFileContent = async (fileBuffer: Buffer, fileType: string, fileName: string): Promise<string> => {
  const supportedMimeTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];

  if (supportedMimeTypes.includes(fileType)) {
    try {
      return await extractor.extractText({ input: fileBuffer, type: 'buffer' });
    } catch (err) {
      console.error(`Error processing file (${fileType}):`, err);
      throw new Error(`Error processing file (${fileType})`);
    }
  } else if (fileType === 'text/plain' || ['application/xml', 'text/xml', 'text/html'].includes(fileType) || fileName.endsWith('.md') || fileName.endsWith('.mdx') || fileType === 'application/rtf') {
    return fileBuffer.toString('utf-8');
  } else if (fileType === 'application/json') {
    const content = JSON.parse(fileBuffer.toString('utf-8'));
    return JSON.stringify(content, null, 2);
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
