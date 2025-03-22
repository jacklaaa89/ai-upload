import { NextResponse } from "next/server";
import formidable from "formidable";
import fs from "fs/promises";
import FormData from "form-data";
import axios from "axios";
import { Readable } from "stream";

export const config = {
  api: {
    bodyParser: false, // Required to use formidable
  },
};

// Convert Next.js Fetch API ReadableStream to Node.js Readable Stream
async function toNodeReadableStream(req: Request) {
  const reader = req.body?.getReader();
  if (!reader) throw new Error("No readable stream found in request.");

  return new Readable({
    async read() {
      const { done, value } = await reader.read();
      if (done) this.push(null);
      else this.push(value);
    },
  });
}

export async function POST(req: Request) {
  try {
    // Convert Next.js Request into a Readable Stream
    const nodeStream = await toNodeReadableStream(req);

    // ✅ Create a fake IncomingMessage object with headers
    const fakeReq = Object.assign(nodeStream, {
      headers: Object.fromEntries(req.headers), // Convert headers from Fetch API format
      method: req.method,
    });

    // Initialize formidable
    const form = formidable({ multiples: true, keepExtensions: true });

    // Parse form-data using formidable
    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(fakeReq, (err, fields, files) => {
        if (err) reject(err);
        else resolve([fields, files]);
      });
    });

    // Create FormData to send to another API
    const formData = new FormData();

    // Add fields
    for (const key in fields) {
      formData.append(key, fields[key]);
    }

    if (files) {
      for (const key in files) {
        let file = files[key];

        // ✅ If file is an array (multiple files uploaded), pick the first one
        if (Array.isArray(file)) {
          file = file[0];
        }

        // ✅ Ensure `file.filepath` exists before reading
        if (file?.filepath) {
          const fileBuffer = await fs.readFile(file.filepath);
          formData.append(key, fileBuffer, { filename: file.originalFilename });
        } else {
          console.warn(`Skipping file upload for ${key}, missing filepath.`);
        }
      }
    }

    // Send to external API
    const targetUrl = "http://localhost:2345/api/upload";
    const response = await axios.post(targetUrl, formData, {
      headers: formData.getHeaders(),
    });

    return NextResponse.json(response.data, { status: response.status });
  } catch (error) {
    console.error("File Upload Error:", error);
    return NextResponse.json({ error: "File upload failed" }, { status: 500 });
  }
}
