import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Create uploads directory if it doesn't exist
const uploadsDir = './uploads';
const driverDocsDir = './uploads/drivers';

if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

if (!fs.existsSync(driverDocsDir)) {
    fs.mkdirSync(driverDocsDir);
}

// Configure multer storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Create driver-specific folder
        const driverId = req.body.email?.replace(/[@.]/g, '_') || Date.now().toString();
        const driverFolder = path.join(driverDocsDir, driverId);
        
        if (!fs.existsSync(driverFolder)) {
            fs.mkdirSync(driverFolder, { recursive: true });
        }
        
        cb(null, driverFolder);
    },
    filename: (req, file, cb) => {
        // Generate filename based on field name and timestamp
        const ext = path.extname(file.originalname);
        const filename = `${file.fieldname}_${Date.now()}${ext}`;
        cb(null, filename);
    }
});

// File filter
const fileFilter = (req, file, cb) => {
    // Accept images and PDFs
    const allowedMimeTypes = [
        'image/jpeg',
        'image/jpg', 
        'image/png',
        'image/webp',
        'application/pdf'
    ];
    
    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, WebP and PDF files are allowed.'), false);
    }
};

// Configure multer
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit per file
        files: 10 // Maximum 10 files
    }
});

// Middleware for driver document uploads
export const uploadDriverDocuments = upload.fields([
    { name: 'profileImage', maxCount: 1 },
    { name: 'aadharCard', maxCount: 1 },
    { name: 'panCard', maxCount: 1 },
    { name: 'licenseImage', maxCount: 1 },
    { name: 'policeVerification', maxCount: 1 },
    { name: 'medicalCertificate', maxCount: 1 }
]);

// Middleware for single file upload
export const uploadSingle = (fieldName) => upload.single(fieldName);

// Middleware for multiple files
export const uploadMultiple = (fieldName, maxCount = 5) => upload.array(fieldName, maxCount);

export default upload;