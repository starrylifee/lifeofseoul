import { storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

function canvasToBlob(canvas, quality = 0.82, type = 'image/jpeg') {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type, quality);
  });
}

export async function resizeImageFile(file, { maxSize = 1280, quality = 0.82, mime = 'image/jpeg' } = {}) {
  const img = await loadImage(file);
  const { width, height } = img;
  const scale = Math.min(1, maxSize / Math.max(width, height));
  const targetW = Math.round(width * scale);
  const targetH = Math.round(height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, targetW, targetH);
  const blob = await canvasToBlob(canvas, quality, mime);
  return new File([blob], file.name.replace(/\.(png|jpg|jpeg|webp)$/i, '.jpg'), { type: mime });
}

export async function uploadMultipleImages(files, uploadPath, { maxWidth = 1280, maxHeight = 1280, quality = 0.82, shouldResize = true } = {}) {
  const results = [];
  for (const file of files) {
    let out = file;
    if (shouldResize) {
      const mime = 'image/jpeg';
      const maxSize = Math.max(maxWidth, maxHeight);
      out = await resizeImageFile(file, { maxSize, quality, mime });
    }
    const fileRef = ref(storage, `${uploadPath}/${Date.now()}_${out.name}`);
    const snapshot = await uploadBytes(fileRef, out, { contentType: out.type });
    const url = await getDownloadURL(snapshot.ref);
    results.push({ url, path: snapshot.ref.fullPath });
  }
  return results;
}

export async function deleteByUrl(url) {
  const match = url.match(/\/o\/(.+)\?alt=media/);
  if (!match) return;
  const fullPath = decodeURIComponent(match[1]);
  await deleteObject(ref(storage, fullPath));
}