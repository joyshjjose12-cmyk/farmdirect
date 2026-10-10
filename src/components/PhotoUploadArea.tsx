import { useState, useRef } from 'react';
import { UploadCloud, X, ImageIcon } from 'lucide-react';

const MAX_SIZE_MB = 5;

interface PhotoUploadAreaProps {
  previewImage?: string;
  onFileChange?: (file: File | null) => void;
}

export default function PhotoUploadArea({
  previewImage,
  onFileChange,
}: PhotoUploadAreaProps) {
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(previewImage ?? null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file (PNG or JPG).');
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`Photo must be smaller than ${MAX_SIZE_MB}MB.`);
      return;
    }
    setError(null);
    setPreview(URL.createObjectURL(file));
    onFileChange?.(file);
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      {!preview ? (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            handleFile(e.dataTransfer.files?.[0]);
          }}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed py-10 transition-all ${
            dragging
              ? 'border-green-500 bg-green-50'
              : 'border-gray-200 bg-gray-50/60 hover:border-green-300 hover:bg-green-50/40'
          }`}
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-green-50 text-green-600">
            <UploadCloud size={24} />
          </span>
          <p className="mt-3 text-sm font-semibold text-gray-700">
            Drag & drop or click to upload
          </p>
          <p className="mt-1 text-xs text-gray-400">
            PNG or JPG, up to {MAX_SIZE_MB}MB
          </p>
        </div>
      ) : (
        <div className="relative overflow-hidden rounded-xl border border-gray-100">
          <img
            src={preview}
            alt="Listing preview"
            className="h-48 w-full object-cover"
          />
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-gray-900/70 to-transparent px-4 py-3">
            <span className="flex items-center gap-1.5 text-xs font-medium text-white">
              <ImageIcon size={14} />
              Photo selected
            </span>
            <button
              type="button"
              onClick={() => {
                setPreview(null);
                onFileChange?.(null);
                if (inputRef.current) inputRef.current.value = '';
              }}
              className="flex items-center gap-1 rounded-lg bg-white/90 px-2.5 py-1 text-xs font-semibold text-gray-700 transition-colors hover:bg-white"
            >
              <X size={13} />
              Remove
            </button>
          </div>
        </div>
      )}

      {error && <p className="mt-2 text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}