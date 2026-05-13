
import { useState } from 'react';
import fallbackImg from '../assets/notfound.png';

export default function ImagenSegura({ src, alt, className }) {
  const [hasError, setHasError] = useState(false);

  const esUrlSegura = (url) => {
    if (!url) return false;
    if (url.startsWith('data:image/')) return true;
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const urlSegura = esUrlSegura(src);

  const urlFinal = (src && urlSegura && !hasError) ? src : fallbackImg;

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <img 
        src={urlFinal} 
        alt={alt} 
        className={className}
        onError={() => setHasError(true)}
      />
      

      {(hasError || (!urlSegura && src)) && (
        <div className="absolute bottom-2 bg-red-100/90 text-red-600 text-[10px] font-bold px-2 py-1 rounded shadow-sm backdrop-blur-sm">
          ⚠️ Enlace roto
        </div>
      )}
    </div>
  );
}