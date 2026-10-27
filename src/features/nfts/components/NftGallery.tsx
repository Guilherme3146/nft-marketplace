import { useState } from "react";

interface NftGalleryProps {
  images: string[];
  productName: string;
}

export function NftGallery({ images, productName }: NftGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <div className="flex gap-4">
      <div className="flex flex-col gap-4">
        {images.map((image, index) => (
          <button
            key={image + index}
            type="button"
            onClick={() => setActiveIndex(index)}
            aria-label={`Ver imagem ${index + 1} de ${images.length}`}
            aria-pressed={index === activeIndex}
            className={
              index === activeIndex
                ? "size-[100px] overflow-hidden rounded-lg border border-primary"
                : "size-[100px] overflow-hidden rounded-lg border border-transparent"
            }
          >
            <img
              src={image}
              alt=""
              width={100}
              height={100}
              loading="lazy"
              className="size-full object-cover"
            />
          </button>
        ))}
      </div>

      <div className="flex size-[444px] items-center justify-center rounded-md bg-card p-4">
        <img
          src={images[activeIndex]}
          alt={`Arte do NFT ${productName}`}
          width={404}
          height={404}
          className="size-[404px] rounded-3xl object-cover"
        />
      </div>
    </div>
  );
}
