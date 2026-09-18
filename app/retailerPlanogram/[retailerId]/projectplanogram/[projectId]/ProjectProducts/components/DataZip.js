import JSZip from "jszip";

/**
 * Zips one or multiple files from Uppy.
 * Handles both single-file and multi-file inputs.
 */
export default async function DataZip(input, uploadType) {

  const zip = new JSZip();

  //  Normalize input: always an array
  const files = Array.isArray(input) ? input : [input];

  for (const fl of files) {
    // If it’s an Uppy file object
    if (fl?.data instanceof File) {
      zip.file(fl.name || fl.data.name, fl.data);
    }
    // If it’s a plain File (no .data wrapper)
    else if (fl instanceof File) {
      zip.file(fl.name, fl);
    } else {
      console.warn("Skipping invalid file:", fl);
    }
  }

  // Choose compression options
  const compressionOptions =
    uploadType === "PDF"
      ? { type: "blob" }
      : {
          type: "blob",
          compression: "DEFLATE",
          compressionOptions: { level: 6 },
        };

  const blob = await zip.generateAsync(compressionOptions);
  return blob;
}
