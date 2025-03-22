import { NextRequest, NextResponse } from 'next/server';
import { join } from 'path';
import axios from 'axios';

// In-memory storage for demo purposes - in production, use a proper storage solution
const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads');

export async function POST(request: NextRequest) {
  try {

    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    
    if (files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }
    
    const response = await axios.post("http://localhost:2346/api/upload", formData, {
      headers: {
        "Content-Type": 'multipart/form-data',
      },
      responseType: "json",
    });
    
    return NextResponse.json({ files: response.data });
  } catch (error) {
    console.error('Error uploading files:', error);
    return NextResponse.json(
      { error: 'Failed to upload files' },
      { status: 500 }
    );
  }
} 