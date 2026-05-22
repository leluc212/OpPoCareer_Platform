import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';

/**
 * Component to handle dynamic translation of text content.
 * @param {Object} props
 * @param {string} props.text - The text to translate.
 * @param {string} [props.as='span'] - The HTML element to render.
 * @param {string} [props.className] - CSS classes.
 * @param {string} [props.sourceLang='vi'] - The original language of the text.
 * @param {boolean} [props.showIndicator=true] - Whether to show a "machine translated" indicator.
 */
const DynamicTranslate = ({
  text,
  as: Component = 'span',
  className = '',
  sourceLang = 'vi',
  showIndicator = true
}) => {
  const { language, translateText } = useLanguage();
  const [translatedContent, setTranslatedContent] = useState(text);
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState('original');

  useEffect(() => {
    let isMounted = true;

    const handleTranslation = async () => {
      if (!text) return;
      
      // If same language, no need to call API
      if (language === sourceLang) {
        setTranslatedContent(text);
        setType('original');
        return;
      }

      setLoading(true);
      try {
        const result = await translateText(text, sourceLang);
        if (isMounted) {
          setTranslatedContent(result.translatedText);
          setType(result.type);
        }
      } catch (error) {
        console.error('DynamicTranslate error:', error);
        if (isMounted) {
          setTranslatedContent(text);
          setType('error');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    handleTranslation();

    return () => {
      isMounted = false;
    };
  }, [text, language, sourceLang, translateText]);

  if (loading) {
    return (
      <Component className={className}>
        {translatedContent || '...'}
      </Component>
    );
  }

  return (
    <Component className={className} title={type === 'machine' ? 'Machine Translated' : undefined}>
      {translatedContent}
      {showIndicator && type === 'machine' && (
        <span className="ml-1 text-[10px] italic text-gray-400 select-none" title="Machine Translated">
          (AI)
        </span>
      )}
    </Component>
  );
};

export default DynamicTranslate;
