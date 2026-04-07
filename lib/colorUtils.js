import { FastAverageColor } from 'fast-average-color';

const fac = new FastAverageColor();

/**
 * Extracts the average color from an image URL and determines optimal text and tag colors.
 * @param {string} imageUrl The URL of the image to analyze
 * @returns {Promise<{ bgColor: string, textColor: string, tagStyle: string }>}
 */
export const extractThemeFromImage = async (imageUrl) => {
    try {
        // We use an image proxy or crossOrigin to avoid CORS issues if possible,
        // but for many standard URLs (like Unsplash) it works out of the box if crossOrigin is set.
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.src = imageUrl;

        return new Promise((resolve, reject) => {
            img.onload = () => {
                try {
                    const color = fac.getColor(img, { algorithm: 'dominant' });

                    // color.hex gives us the dominant hex code (e.g., #ff0000)
                    // color.isDark (boolean) tells us if we need light or dark text

                    // 1. Determine optimal Text Color
                    const textColor = color.isDark ? 'text-white' : 'text-[#2a2726]';

                    // 2. Generate a tailored background class using arbitrary arbitrary values in Tailwind:
                    // e.g., bg-[#ff0000]
                    const bgColor = `bg-[${color.hex}]`;

                    // 3. Determine a complimentary Tag Style
                    // For a modern look: if dark background, tag is white with dark text.
                    // If light background, tag is dark with light text.
                    const tagStyle = color.isDark
                        ? 'bg-white text-[#2a2726]'
                        : 'bg-[#2a2726] text-white';

                    resolve({ bgColor, textColor, tagStyle });
                } catch (e) {
                    reject(e);
                }
            };
            img.onerror = (e) => reject(e);
        });
    } catch (error) {
        console.error("Failed to extract color theme:", error);
        throw error;
    }
};
