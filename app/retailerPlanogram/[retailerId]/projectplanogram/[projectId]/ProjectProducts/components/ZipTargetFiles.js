import JSZip from "jszip";

/**
 * Zips one or multiple files and returns both the zip Blob and filename.
 * @param {File|Array<File>} input - Single file or array of files
 * @param {string} uploadType - Used for setting compression options
 * @returns {Promise<{ blob: Blob, filename: string }>}
 */
export default async function ZipTargetFiles(input, uploadType) {

  const zip = new JSZip();

  // Normalize input: always an array
  const files = Array.isArray(input) ? input : [input];

  // Add files to the zip
  for (const fl of files) {
    if (fl?.data instanceof File) {
      zip.file(fl.name || fl.data.name, fl.data);
    } else if (fl instanceof File) {
      zip.file(fl.name, fl);
    } else {
      console.warn("Skipping invalid file:", fl);
    }
  }

  //Generate a sensible zip filename
  let zipName;
  if (files.length === 1) {
    const originalName = files[0]?.name || files[0]?.data?.name || "file";
    const base = originalName.replace(/\.[^/.]+$/, ""); // remove extension
    zipName = `${base}.zip`;
  } else {
    const date = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    zipName = `files_${date}.zip`;
  }

  // Compression options
  const compressionOptions =
    uploadType === "PDF"
      ? { type: "blob" }
      : {
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: { level: 6 },
      };

  // Generate zip blob
  const blob = await zip.generateAsync(compressionOptions);

  // Return both blob and name
  return { blob, filename: zipName };
}
