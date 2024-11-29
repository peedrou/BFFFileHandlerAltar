import path from 'path';
import fs from 'fs';
import multer, { Multer, FileFilterCallback } from 'multer';
import { Request as MulterRequest } from 'express';
import { Request, Response } from 'express';

class FileUploadService {
  uploadDirectory: string = path.join(__dirname, '..', '..', 'uploads');
  upload: Multer;

  constructor() {
    if (!fs.existsSync(this.uploadDirectory)) {
      fs.mkdirSync(this.uploadDirectory);
    }

    this.upload = multer({
      dest: this.uploadDirectory,
      limits: { fileSize: 250 * 1024 * 1024 },
      fileFilter: this.fileFilter.bind(this),
    });
  }

  fileFilter(
    req: MulterRequest,
    file: Express.Multer.File,
    cb: FileFilterCallback,
  ) {
    if (file.mimetype !== 'text/csv') {
      return cb(new Error('Only CSV files are allowed.'));
    }
    cb(null, true);
  }

  handleFileUpload(req: Request, res: Response) {
    this.upload.single('file')(req, res, (err: any) => {
      if (err) {
        return res.status(400).json({ error: err.message });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded.' });
      }

      res.status(200).json({
        message: 'File Uploaded Successfully',
        filePath: req.file.path,
      });
    });
  }
}

export default FileUploadService;
