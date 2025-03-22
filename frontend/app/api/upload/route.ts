import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { mkdir } from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';

// In-memory storage for demo purposes - in production, use a proper storage solution
const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads');

export async function POST(request: NextRequest) {
  try {
    // Ensure upload directory exists
    try {
      await mkdir(UPLOAD_DIR, { recursive: true });
    } catch (err) {
      console.error('Error creating upload directory:', err);
    }

    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    
    if (files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }
    
    const savedFiles = await Promise.all(
      files.map(async (file) => {
        const fileId = uuidv4();
        const fileName = file.name;
        const fileType = file.type;
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        
        // Generate unique filename to prevent overwriting
        const uniqueFilename = `${fileId}-${fileName}`;
        const filePath = join(UPLOAD_DIR, uniqueFilename);
        
        // Save file to disk
        await writeFile(filePath, buffer);
        
        // Return file information with public URL
        return {
          id: fileId,
          name: fileName,
          type: fileType,
          size: file.size,
          url: `/uploads/${uniqueFilename}`,
        };
      })
    );
    
    return NextResponse.json({ files: savedFiles });
  } catch (error) {
    console.error('Error uploading files:', error);
    return NextResponse.json(
      { error: 'Failed to upload files' },
      { status: 500 }
    );
  }
} 