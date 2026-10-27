import { useState } from "react";

interface NftGalleryProps {
  images: string[];
  productName: string;
}

export function NftGallery({ images, productName }: NftGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <div className="flex w-full flex-col gap-4 md:w-auto md:flex-row">
      <div className="flex gap-4 overflow-x-auto md:flex-col">
        {images.map((image, index) => (
          <button
            key={image + index}
            type="button"
            onClick={() => setActiveIndex(index)}
            aria-label={`Ver imagem ${index + 1} de ${images.length}`}
            aria-pressed={index === activeIndex}
            className={
              index === activeIndex
                ? "size-[70px] shrink-0 overflow-hidden rounded-lg border border-primary md:size-[100px]"
                : "size-[70px] shrink-0 overflow-hidden rounded-lg border border-transparent md:size-[100px]"
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

      <div className="flex aspect-square w-full items-center justify-center rounded-md bg-card p-4 md:size-[444px]">
        <img
          src={images[activeIndex]}
          alt={`Arte do NFT ${productName}`}
          width={404}
          height={404}
          className="size-full rounded-3xl object-cover md:size-[404px]"
        />
      </div>
    </div>
  );
}
