const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?[0-9]{8,15}$/;

const ALLOWED_STATUSES = ['Pending', 'In Transit', 'Delivered', 'Cancelled'];

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAGIC_BYTES = {
  'image/png': [0x89, 0x50, 0x4e, 0x47],
  'image/jpeg': [0xff, 0xd8, 0xff],
  'image/webp': [0x52, 0x49, 0x46, 0x46],
};
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

export const sanitize = (str) => {
  if (typeof str !== 'string') return str;
  return str.trim().replace(/[\x00-\x1f\x7f]/g, '');
};

export const isValidEmail = (str) =>
  typeof str === 'string' && EMAIL_REGEX.test(str.trim());

export const isValidPhone = (str) =>
  typeof str === 'string' && PHONE_REGEX.test(str.trim().replace(/[\s-]/g, ''));

export const isValidPassword = (str) =>
  typeof str === 'string' && str.length >= 8;

export const isValidName = (str) =>
  typeof str === 'string' && str.trim().length >= 1 && str.trim().length <= 100;

export const isValidUUID = (str) =>
  typeof str === 'string' && UUID_REGEX.test(str);

export const isValidStatus = (str) =>
  typeof str === 'string' && ALLOWED_STATUSES.includes(str);

export const isValidAddress = (str) =>
  typeof str === 'string' && str.trim().length >= 1 && str.trim().length <= 500;

export const isValidIdNumber = (str) =>
  typeof str === 'string' && str.trim().length >= 1 && str.trim().length <= 50;

export const validateBase64Image = (base64String) => {
  if (!base64String || typeof base64String !== 'string') {
    return { valid: false, error: 'No image data provided' };
  }

  const mimeMatch = base64String.match(/^data:(image\/\w+);base64,/);
  if (!mimeMatch) {
    return { valid: false, error: 'Invalid base64 image format' };
  }

  const mimeType = mimeMatch[1];
  if (!ALLOWED_IMAGE_TYPES.includes(mimeType)) {
    return { valid: false, error: `Image type ${mimeType} not allowed. Use JPEG, PNG, or WebP` };
  }

  const raw = base64String.replace(/^data:image\/\w+;base64,/, '');
  const buffer = Buffer.from(raw, 'base64');

  if (buffer.length > MAX_IMAGE_SIZE) {
    return { valid: false, error: `Image exceeds 5MB limit (${(buffer.length / 1024 / 1024).toFixed(1)}MB)` };
  }

  const expected = MAGIC_BYTES[mimeType];
  if (expected) {
    const header = [...buffer.slice(0, expected.length)];
    if (!expected.every((b, i) => header[i] === b)) {
      return { valid: false, error: 'File content does not match declared image type' };
    }
  }

  const extMap = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
  return { valid: true, buffer, ext: extMap[mimeType] };
};

export const validateIdParam = (req, res, next) => {
  if (req.params.id && !isValidUUID(req.params.id)) {
    return res.status(400).json({ error: 'Invalid ID format' });
  }
  next();
};
