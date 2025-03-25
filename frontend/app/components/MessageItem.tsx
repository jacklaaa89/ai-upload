"use client";

import React from "react";
import { Message } from "../types";
import Image from "next/image";

interface MessageItemProps {
  message: Message;
}

export default function MessageItem({ message }: MessageItemProps) {
  const { role, content, attachments } = message;

  const isUser = role === "user";

  return (
    <div
      className={`flex items-start space-x-4 ${
        isUser ? "justify-end" : ""
      } mb-4`}
    >
      {!isUser && (
        <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white flex-shrink-0 text-sm font-medium shadow-sm">
          AI
        </div>
      )}

      <div
        className={`max-w-[80%] ${
          isUser ? "bg-blue-100" : "bg-gray-100"
        } p-4 rounded-lg shadow-sm`}
      >
        {/* Message content */}
        <p className="text-sm whitespace-pre-wrap">{content}</p>

        {/* Attachments */}
        {attachments && attachments.length > 0 && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="rounded overflow-hidden border border-gray-200"
              >
                {attachment.previewUrl ? (
                  <div className="relative h-32 w-full">
                    <img
                      src={attachment.previewUrl}
                      alt={attachment.name}
                      className="object-cover w-full h-full"
                    />
                  </div>
                ) : (
                  <div className="p-2 bg-gray-50 text-xs text-gray-700 flex items-center justify-center h-20">
                    <div className="truncate max-w-full">{attachment.name}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {isUser && (
        <div className="h-10 w-10 rounded-full bg-green-500 flex items-center justify-center text-white flex-shrink-0 text-sm font-medium shadow-sm">
          You
        </div>
      )}
    </div>
  );
}
