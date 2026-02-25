const multer = require('multer');
const path = require('path');
const os = require('os');
const fs = require('fs');

// Create a separate upload directory for community media
const communityUploadDir = path.join(os.tmpdir(), 'rubbersense_community_uploads');
if (!fs.existsSync(communityUploadDir)) {
  fs.mkdirSync(communityUploadDir, { recursive: true });
}

// Configure multer for community media with different settings
const communityStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, communityUploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, base + ext);
  }
});

// Allow more file types for community
const communityFileFilter = (req, file, cb) => {
  const allowedImageTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'image/bmp',
    'image/tiff'
  ];
  
  const allowedVideoTypes = [
    'video/mp4',
    'video/mpeg',
    'video/ogg',
    'video/webm',
    'video/quicktime',
    'video/x-msvideo',
    'video/x-ms-wmv'
  ];
  
  const allAllowedTypes = [...allowedImageTypes, ...allowedVideoTypes];
  
  if (allAllowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Allowed types: images (JPEG, PNG, GIF, WebP, etc.) and videos (MP4, WebM, etc.)'), false);
  }
};

const communityUpload = multer({
  storage: communityStorage,
  fileFilter: communityFileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB per file for videos
    files: 10 // Max 10 files
  }
});

// @desc    Upload single file for community (comments)
// @route   POST /api/v1/upload/community/single
// @access  Private
exports.uploadCommunitySingle = async (req, res, next) => {
  try {
    const uploadSingle = communityUpload.single('media');
    
    uploadSingle(req, res, (err) => {
      if (err) {
        console.error('Community single upload error:', err);
        return res.status(400).json({
          success: false,
          message: err.message || 'File upload error'
        });
      }
      
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }
      
      const fileInfo = {
        url: `/uploads/community/${req.file.filename}`,
        mimetype: req.file.mimetype,
        filename: req.file.filename,
        size: req.file.size,
        originalname: req.file.originalname
      };
      
      res.status(200).json({
        success: true,
        file: fileInfo
      });
    });
  } catch (error) {
    console.error('Upload community single error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during upload'
    });
  }
};

// @desc    Upload multiple files for community (posts)
// @route   POST /api/v1/upload/community/multiple
// @access  Private
exports.uploadCommunityMultiple = async (req, res, next) => {
  try {
    const uploadMultiple = communityUpload.array('media', 10);
    
    uploadMultiple(req, res, (err) => {
      if (err) {
        console.error('Community multiple upload error:', err);
        return res.status(400).json({
          success: false,
          message: err.message || 'File upload error'
        });
      }
      
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No files uploaded'
        });
      }
      
      const files = req.files.map(file => ({
        url: `/uploads/community/${file.filename}`,
        mimetype: file.mimetype,
        filename: file.filename,
        size: file.size,
        originalname: file.originalname
      }));

      res.status(200).json({
        success: true,
        files: files
      });
    });
  } catch (error) {
    console.error('Upload community multiple error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during upload'
    });
  }
};

// @desc    Handle direct community post creation with media
// @route   POST /api/v1/upload/community/post
// @access  Private
exports.createCommunityPostWithMedia = async (req, res, next) => {
  try {
    const uploadMultiple = communityUpload.array('media', 10);
    
    uploadMultiple(req, res, async (err) => {
      if (err) {
        console.error('Community post upload error:', err);
        return res.status(400).json({
          success: false,
          message: err.message || 'File upload error'
        });
      }
      
      const { title, content } = req.body;
      const userId = req.user?._id;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }
      
      // At least one field must be present
      if (!title && !content && (!req.files || req.files.length === 0)) {
        return res.status(400).json({
          success: false,
          message: 'Post must have either title, content, or media'
        });
      }
      
      // Process uploaded files
      const media = req.files ? req.files.map(file => ({
        url: `/uploads/community/${file.filename}`,
        mimetype: file.mimetype,
        filename: file.filename,
        size: file.size,
        originalname: file.originalname
      })) : [];
      
      // Here you would create the post in your database
      // For now, return the processed data
      res.status(200).json({
        success: true,
        message: 'Post would be created here',
        data: {
          title: title || '',
          content: content || '',
          media: media,
          userId: userId
        }
      });
    });
  } catch (error) {
    console.error('Create community post error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during post creation'
    });
  }
};