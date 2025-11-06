import React, { useState, useRef } from 'react';
import ReactCrop, { Crop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import BaseModal from './BaseModal';

interface ImageCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  onCropComplete: (croppedImageUrl: string) => void;
}

const ImageCropModal: React.FC<ImageCropModalProps> = ({ isOpen, onClose, imageSrc, onCropComplete }) => {
  // Fixed aspect ratio matching balance card dimensions (credit card ratio: 1.586:1)
  const CARD_ASPECT_RATIO = 1.586;
  const [crop, setCrop] = useState<Crop>({
    unit: '%',
    width: 80,
    height: 80 / CARD_ASPECT_RATIO,
    x: 10,
    y: 10
  });
  const imgRef = useRef<HTMLImageElement>(null);

  const getCroppedImg = () => {
    const image = imgRef.current;
    if (!image || !crop.width || !crop.height) {
      return;
    }

    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    
    // Calculate actual crop dimensions in pixels from the original image
    const pixelCrop = {
      x: crop.x * scaleX,
      y: crop.y * scaleY,
      width: crop.width * scaleX,
      height: crop.height * scaleY
    };

    // Set canvas size to maintain high quality - use original crop dimensions
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      // Enable high-quality image rendering
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      
      ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
      );
      
      // Use higher quality JPEG with 0.95 quality for better results
      onCropComplete(canvas.toDataURL('image/jpeg', 0.95));
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Crop Image"
      size="lg"
      animation="slide-up"
      aria-label="Image crop modal"
    >
      <div className="space-y-4 p-3 sm:p-6 max-h-[calc(100vh-12rem)] overflow-y-auto">
        {/* Instructions */}
        <div className="mb-4">
          <p className="text-sm text-[rgb(var(--color-text-muted-rgb))]">
            Crop your image to match the balance card dimensions. Drag the corners to adjust the crop area.
          </p>
        </div>

        {/* Crop Area - Responsive container */}
        <div className="flex items-center justify-center bg-[rgb(var(--color-card-muted-rgb))] rounded-lg p-4 min-h-[300px] sm:min-h-[400px]">
          <div className="w-full h-full flex items-center justify-center">
            <ReactCrop
              crop={crop}
              onChange={c => setCrop(c)}
              aspect={CARD_ASPECT_RATIO}
              keepSelection={true}
              className="max-w-full max-h-full"
            >
              <img
                ref={imgRef}
                src={imageSrc}
                alt="Crop preview"
                className="max-w-full max-h-full object-contain"
                style={{
                  maxHeight: 'calc(60vh - 150px)',
                  maxWidth: '100%',
                  width: 'auto',
                  height: 'auto'
                }}
                draggable={false}
              />
            </ReactCrop>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:justify-end gap-3 pt-4 border-t border-[rgb(var(--color-border-rgb))]">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 text-sm font-medium text-[rgb(var(--color-text-rgb))] bg-[rgb(var(--color-card-muted-rgb))] border border-[rgb(var(--color-border-rgb))] rounded-lg hover:bg-[rgb(var(--color-border-rgb))] transition-colors min-h-[44px]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={getCroppedImg}
            className="w-full sm:w-auto px-4 py-2.5 text-sm font-medium bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors min-h-[44px] shadow-sm"
          >
            Apply Crop
          </button>
        </div>
      </div>
    </BaseModal>
  );
};

export default ImageCropModal;