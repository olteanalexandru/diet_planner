import React, { useState } from 'react';
import { Copy, Check, X } from 'lucide-react';

interface ShareModalProps {
  activityId: string;
  recipeTitle?: string;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  activityId,
  recipeTitle,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const shareUrl = `${window.location.origin}/activity/${activityId}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-space-800 rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Share {recipeTitle}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-300 p-2 hover:bg-space-700 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={shareUrl}
              readOnly
              className="flex-1 bg-space-900 border border-space-700 rounded-lg px-3 py-2 text-sm text-gray-300"
            />
            <button
              onClick={handleCopy}
              className="btn-cyber-outline flex items-center gap-2"
            >
              {copied ? (
                <>
                  <Check size={16} />
                  Copied!
                </>
              ) : (
                <>
                  <Copy size={16} />
                  Copy
                </>
              )}
            </button>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-sm text-gray-400">Share on social media</p>
            <div className="flex gap-2">
              <a
                href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(
                  shareUrl
                )}&text=${encodeURIComponent(
                  `Check out this recipe: ${recipeTitle}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-cyber flex-1"
              >
                Twitter
              </a>
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                  shareUrl
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-cyber flex-1"
              >
                Facebook
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
