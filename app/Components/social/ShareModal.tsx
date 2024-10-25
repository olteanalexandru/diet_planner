import React, { useState } from 'react';
import { Twitter, Facebook, Link as LinkIcon, X } from 'lucide-react';

interface ShareModalProps {
  activityId: string;
  recipeTitle?: string;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ 
  activityId, 
  recipeTitle, 
  onClose 
}) => {
  const [copied, setCopied] = useState(false);
  const shareUrl = `${window.location.origin}/activity/${activityId}`;

  const shareOptions = [
    {
      name: 'Twitter',
      icon: <Twitter size={20} />,
      action: () => {
        window.open(
          `https://twitter.com/intent/tweet?text=Check out this recipe: ${recipeTitle}&url=${shareUrl}`,
          '_blank'
        );
      },
    },
    {
      name: 'Facebook',
      icon: <Facebook size={20} />,
      action: () => {
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`,
          '_blank'
        );
      },
    },
    {
      name: 'Copy Link',
      icon: <LinkIcon size={20} />,
      action: async () => {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      },
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-space-800 rounded-lg p-6 max-w-sm w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Share</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-300">
            <X size={20} />
          </button>
        </div>
        
        <div className="space-y-4">
          {shareOptions.map((option) => (
            <button
              key={option.name}
              onClick={option.action}
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-space-700 transition-colors"
            >
              {option.icon}
              <span>
                {option.name === 'Copy Link' && copied ? 'Copied!' : option.name}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};