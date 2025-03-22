"use client";

import React from "react";
import axios from "axios";

export default function FileUpload() {
  const [file, setFile] = React.useState(null);
  const [status, setStatus] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [responseData, setResponseData] = React.useState("");

  const handleFileChange = (event: any) => {
    setFile(event.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      setStatus("Please select a file first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setStatus("Uploading...");
      const response = await axios.post("/api/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        responseType: "json",
      });
      console.log(await response.data, "respons");
      setResponseData(response.data);
      setOpen(true);
    } catch (error) {
      console.error("Error uploading file:", error);
      setStatus("Failed to upload file");
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4 border rounded-lg shadow-md">
      {open && <p>{responseData}</p>}
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
