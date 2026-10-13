"use client";

// Prepares a moon photo for upload: shrinks it (max 1600 px on the long side) and saves it
// again as a JPEG. Re-saving through a canvas drops the photo's hidden data (EXIF),
// including the GPS location most phone photos carry, so no location is uploaded.

const MAX_SIDE = 1600;

export async function preparePhoto(file: File): Promise<Blob> {
  // "from-image" turns the photo the way the camera meant it before the hidden data is dropped.
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Couldn't read the photo."))), "image/jpeg", 0.82),
  );
}
