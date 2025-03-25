"use client";

import {
  FaFile,
  FaFileAlt,
  FaFileAudio,
  FaFileCode,
  FaFileCsv,
  FaFileExcel,
  FaFileImage,
  FaFilePdf,
  FaFileVideo,
  FaFileWord,
} from "react-icons/fa";
import { Attachment } from "../types";

interface FilePreviewProps {
  attachment: Attachment;
  onOpen?: (url: string) => void;
  className?: string;
}

export default function FilePreview({
  attachment,
  onOpen,
  className = "",
}: FilePreviewProps) {
  const isImage = attachment.type.startsWith("image/");
  const isPdf = attachment.type === "application/pdf";
  const isVideo = attachment.type.startsWith("video/");
  const isAudio = attachment.type.startsWith("audio/");

  const handleClick = () => {
    if (onOpen) {
      onOpen(attachment.url);
    } else {
      window.open(attachment.url, "_blank");
    }
  };

  const getFileIcon = () => {
    const fileTypes = [
      {
        check: isImage,
        icon: <FaFileImage className="text-blue-500" size={24} />,
      },
      { check: isPdf, icon: <FaFilePdf className="text-red-500" size={24} /> },
      {
        check: isVideo,
        icon: <FaFileVideo className="text-purple-500" size={24} />,
      },
      {
        check: isAudio,
        icon: <FaFileAudio className="text-green-500" size={24} />,
      },
      {
        check:
          attachment.type.includes("word") || attachment.type.includes("doc"),
        icon: <FaFileWord className="text-blue-700" size={24} />,
      },
      {
        check:
          attachment.type.includes("excel") || attachment.type.includes("xlsx"),
        icon: <FaFileExcel className="text-green-700" size={24} />,
      },
      {
        check: attachment.type.includes("csv"),
        icon: <FaFileCsv className="text-green-600" size={24} />,
      },
      {
        check: attachment.type.includes("text"),
        icon: <FaFileAlt className="text-gray-500" size={24} />,
      },
      {
        check: ["javascript", "json", "html", "css"].some((ext) =>
          attachment.type.includes(ext)
        ),
        icon: <FaFileCode className="text-indigo-500" size={24} />,
      },
    ];

    return (
      fileTypes.find(({ check }) => check)?.icon || (
        <FaFile className="text-gray-400" size={24} />
      )
    );
  };

  // Render different preview based on file type
  const renderPreview = () => {
    // For images, show the actual image
    if (isImage && attachment.previewUrl) {
      return (
        <div className={`file-preview ${className}`} onClick={handleClick}>
          <img
            src={attachment.previewUrl}
            alt={attachment.name}
            className="file-preview-image cursor-pointer"
          />
          <div className="text-xs mt-1 text-gray-600 truncate">
            {attachment.name}
          </div>
        </div>
      );
    }

    // For PDFs, provide a preview if possible, otherwise show icon
    if (isPdf) {
      if (attachment.previewUrl) {
        return (
          <div className={`file-preview ${className}`}>
            <img
              src={attachment.previewUrl}
              alt={`PDF: ${attachment.name}`}
              className="file-preview-image cursor-pointer"
              onClick={handleClick}
            />
            <div className="text-xs mt-1 text-gray-600 truncate">
              {attachment.name}
            </div>
          </div>
        );
      }
    }

    // For videos, show a thumbnail if available or an embedded player
    if (isVideo && attachment.previewUrl) {
      return (
        <div className={`file-preview ${className}`}>
          <div className="relative cursor-pointer" onClick={handleClick}>
            <img
              src={attachment.previewUrl}
              alt={`Video: ${attachment.name}`}
              className="file-preview-image"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
              <div className="w-12 h-12 rounded-full bg-white bg-opacity-80 flex items-center justify-center">
                <div className="w-0 h-0 ml-1 border-t-8 border-t-transparent border-l-12 border-l-black border-b-8 border-b-transparent" />
              </div>
            </div>
          </div>
          <div className="text-xs mt-1 text-gray-600 truncate">
            {attachment.name}
          </div>
        </div>
      );
    }

    // For audio, show a simple player
    if (isAudio) {
      return (
        <div className={`file-preview-document p-3 ${className}`}>
          <audio controls className="w-full max-w-xs" src={attachment.url}>
            Your browser does not support the audio element.
          </audio>
          <div className="text-xs mt-1 text-gray-600 truncate">
            {attachment.name}
          </div>
        </div>
      );
    }

    // Default file preview with icon and name
    return (
      <div
        className={`file-preview-document cursor-pointer ${className}`}
        onClick={handleClick}
      >
        <div className="file-preview-icon">{getFileIcon()}</div>
        <div className="flex flex-col">
          <div className="font-medium text-sm truncate max-w-[200px]">
            {attachment.name}
          </div>
          <div className="text-xs text-gray-500">
            {attachment.type.split("/")[1]?.toUpperCase() || "FILE"}
          </div>
        </div>
      </div>
    );
  };

  return renderPreview();
}
