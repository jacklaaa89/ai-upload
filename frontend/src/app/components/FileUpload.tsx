'use client';

import { useState } from 'react';
import axios from 'axios';

export default function FileUpload() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('');
  const [open, setOpen] = useState(false);

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      setStatus('Please select a file first.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      setStatus('Uploading...');
      const response = await axios.post('http://localhost:2345/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        responseType: "stream"
      });

      setOpen(true);
    } catch (error) {
      console.error('Error uploading file:', error);
      setStatus('Failed to upload file');
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4 border rounded-lg shadow-md">
      <input type="file" onChange={handleFileChange} />
      <button
        onClick={handleUpload}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Upload
      </button>
      {status && <p>{status}</p>}
    </div>
  );
}