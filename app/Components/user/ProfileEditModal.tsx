import React, { useState } from 'react';
import { User } from '@/app/types';
import { Loader2, X, Camera, Link as LinkIcon, MapPin } from 'lucide-react';

interface ProfileEditModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedUser: User) => void;
}

export const ProfileEditModal: React.FC<ProfileEditModalProps> = ({
  user: initialUser,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: initialUser.name || '',
    bio: initialUser.bio || '',
    location: initialUser.location || '',
    website: initialUser.website || '',
    specialties: initialUser.specialties || [],
    dietaryPreferences: initialUser.dietaryPreferences || []
  });

  const dietaryOptions = [
    'Vegetarian',
    'Vegan',
    'Pescatarian',
    'Gluten-Free',
    'Dairy-Free',
    'Keto',
    'Paleo'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/users/${initialUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const { user: updatedUser } = await response.json();
      onSuccess(updatedUser);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-space-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Edit Profile</h2>
            <button onClick={onClose} className="p-2 hover:bg-space-700 rounded-lg">
              <X size={20} />
            </button>
          </div>

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500 rounded-lg text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Profile Picture Placeholder */}
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-cyber-primary/10 flex items-center justify-center">
                {formData.name?.[0]?.toUpperCase() || '?'}
              </div>
              <button type="button" className="btn-cyber-outline flex items-center gap-2">
                <Camera size={16} />
                Change Photo
              </button>
            </div>

            {/* Basic Info */}
            <div>
              <label className="block text-sm font-medium mb-2">Display Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="input-cyber w-full"
                maxLength={50}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Bio</label>
              <textarea
                value={formData.bio}
                onChange={e => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                className="input-cyber w-full"
                rows={4}
                maxLength={500}
                placeholder="Tell us about yourself..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  <MapPin size={16} className="inline mr-2" />
                  Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={e => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  className="input-cyber w-full"
                  placeholder="City, Country"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  <LinkIcon size={16} className="inline mr-2" />
                  Website
                </label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={e => setFormData(prev => ({ ...prev, website: e.target.value }))}
                  className="input-cyber w-full"
                  placeholder="https://"
                />
              </div>
            </div>

            {/* Cooking Preferences */}
            <div>
              <label className="block text-sm font-medium mb-2">Dietary Preferences</label>
              <div className="flex flex-wrap gap-2">
                {dietaryOptions.map(option => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        dietaryPreferences: prev.dietaryPreferences.includes(option)
                          ? prev.dietaryPreferences.filter(p => p !== option)
                          : [...prev.dietaryPreferences, option]
                      }));
                    }}
                    className={`px-3 py-1 rounded-full border transition-colors ${
                      formData.dietaryPreferences.includes(option)
                        ? 'bg-cyber-primary text-space-900 border-cyber-primary'
                        : 'border-space-600 hover:border-cyber-primary'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-6 border-t border-space-700">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="btn-cyber-outline"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-cyber"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};