const multer = require('multer');
const path = require('path');
const os = require('os');
const fs = require('fs');
const { uploadToCloudinary, deleteFromCloudinary } = require('../utils/Cloudinary');

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB per file
  },
  fileFilter: (req, file, cb) => {
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
  }
});

// Helper function to convert buffer to base64
const bufferToBase64 = (file) => {
  const base64 = file.buffer.toString('base64');
  const dataUrl = `data:${file.mimetype};base64,${base64}`;
  
  // Log first 100 characters of base64 to verify format
  console.log(`📸 File: ${file.originalname}, Size: ${file.size} bytes, MIME: ${file.mimetype}`);
  console.log(`🔤 Base64 preview: ${dataUrl.substring(0, 100)}...`);
  console.log(`🔤 Base64 total length: ${base64.length} characters`);
  
  return dataUrl;
};

// Helper function to upload files to Cloudinary using temp files (more reliable)
const uploadFilesToCloudinaryWithTempFiles = async (files, folder = 'rubbersense/community') => {
  if (!files || files.length === 0) return [];
  
  console.log(`📤 Starting upload of ${files.length} files to Cloudinary folder: ${folder}`);
  
  const uploadPromises = files.map(async (file) => {
    let tempFilePath = null;
    try {
      // Create temp directory if it doesn't exist
      const tempDir = path.join(os.tmpdir(), 'rubbersense_temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
        console.log(`📁 Created temp directory: ${tempDir}`);
      }
      
      // Create temp file with proper extension
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 15);
      const ext = path.extname(file.originalname) || '.jpg'; // Default to .jpg if no extension
      tempFilePath = path.join(tempDir, `community-${timestamp}-${random}${ext}`);
      
      console.log(`📝 Writing temp file: ${tempFilePath}`);
      console.log(`📝 File size: ${file.size} bytes`);
      
      // Write buffer to temp file
      fs.writeFileSync(tempFilePath, file.buffer);
      
      // Verify file was written
      if (!fs.existsSync(tempFilePath)) {
        throw new Error('Temp file was not created');
      }
      
      const stats = fs.statSync(tempFilePath);
      console.log(`📝 Temp file written: ${stats.size} bytes`);
      
      if (stats.size === 0) {
        throw new Error('Temp file is empty');
      }
      
      if (stats.size !== file.size) {
        console.warn(`⚠️ File size mismatch: original ${file.size} vs temp ${stats.size}`);
      }
      
      // Check if it's a video for Cloudinary resource type
      const isVideo = file.mimetype.startsWith('video/');
      console.log(`🎥 Is video: ${isVideo}`);
      
      // Upload to Cloudinary using file path
      console.log(`☁️ Uploading to Cloudinary...`);
      const result = await uploadToCloudinary(tempFilePath, folder);
      
      console.log(`✅ Uploaded to Cloudinary successfully: ${result.url}`);
      console.log(`📋 Public ID: ${result.public_id}`);
      
      return {
        url: result.url,
        secure_url: result.url,
        public_id: result.public_id,
        mimetype: file.mimetype,
        filename: result.public_id,
        size: file.size,
        originalname: file.originalname,
        format: file.mimetype.split('/')[1] || 'jpg'
      };
    } catch (error) {
      console.error('❌ Error uploading to Cloudinary:', error);
      console.error('Error details:', error.message);
      if (tempFilePath) {
        console.error('Temp file path:', tempFilePath);
        try {
          if (fs.existsSync(tempFilePath)) {
            const stats = fs.statSync(tempFilePath);
            console.error('Temp file exists, size:', stats.size);
          }
        } catch (e) {
          console.error('Error checking temp file:', e);
        }
      }
      return null;
    } finally {
      // Clean up temp file
      if (tempFilePath && fs.existsSync(tempFilePath)) {
        try {
          fs.unlinkSync(tempFilePath);
          console.log(`🧹 Temp file deleted: ${tempFilePath}`);
        } catch (unlinkError) {
          console.error('Error deleting temp file:', unlinkError);
        }
      }
    }
  });
  
  const results = await Promise.all(uploadPromises);
  const successfulUploads = results.filter(result => result !== null);
  console.log(`✅ Upload complete: ${successfulUploads.length}/${files.length} files uploaded successfully`);
  
  return successfulUploads;
};

// @desc    Upload single file for community (comments)
// @route   POST /api/v1/upload/community/single
// @access  Private
exports.uploadCommunitySingle = async (req, res) => {
  try {
    const uploadSingle = upload.single('media');
    
    uploadSingle(req, res, async (err) => {
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
      
      console.log('📥 Received file for single upload:', req.file.originalname);
      console.log('File details:', {
        mimetype: req.file.mimetype,
        size: req.file.size,
        originalname: req.file.originalname
      });
      
      // Upload to Cloudinary using temp files
      const uploadedFiles = await uploadFilesToCloudinaryWithTempFiles([req.file], 'rubbersense/community/comments');
      
      if (uploadedFiles.length === 0) {
        return res.status(500).json({
          success: false,
          message: 'Failed to upload file to Cloudinary'
        });
      }
      
      res.status(200).json({
        success: true,
        file: uploadedFiles[0]
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
exports.uploadCommunityMultiple = async (req, res) => {
  try {
    const uploadMultiple = upload.array('media', 10);
    
    uploadMultiple(req, res, async (err) => {
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
      
      console.log(`📥 Received ${req.files.length} files for multiple upload`);
      req.files.forEach((file, index) => {
        console.log(`File ${index + 1}:`, {
          originalname: file.originalname,
          mimetype: file.mimetype,
          size: file.size
        });
      });
      
      // Upload all files to Cloudinary using temp files
      const uploadedFiles = await uploadFilesToCloudinaryWithTempFiles(req.files, 'rubbersense/community/posts');
      
      if (uploadedFiles.length === 0) {
        return res.status(500).json({
          success: false,
          message: 'Failed to upload files to Cloudinary'
        });
      }

      res.status(200).json({
        success: true,
        files: uploadedFiles
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

// @desc    Delete a file from Cloudinary
// @route   DELETE /api/v1/upload/community/:publicId
// @access  Private
exports.deleteCommunityFile = async (req, res) => {
  try {
    const { publicId } = req.params;
    
    if (!publicId) {
      return res.status(400).json({
        success: false,
        message: 'Public ID is required'
      });
    }
    
    const result = await deleteFromCloudinary(publicId);
    
    res.status(200).json({
      success: true,
      message: 'File deleted successfully',
      data: result
    });
  } catch (error) {
    console.error('Delete community file error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during file deletion'
    });
  }
};

// @desc    Handle direct community post creation with media (legacy endpoint)
// @route   POST /api/v1/upload/community/post
// @access  Private
exports.createCommunityPostWithMedia = async (req, res) => {
  try {
    const uploadMultiple = upload.array('media', 10);
    
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
      
      // Upload files to Cloudinary
      let media = [];
      if (req.files && req.files.length > 0) {
        media = await uploadFilesToCloudinaryWithTempFiles(req.files, 'rubbersense/community/posts');
        console.log(`✅ Uploaded ${media.length} files to Cloudinary`);
      }
      
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