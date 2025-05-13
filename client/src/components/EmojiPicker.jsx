import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import { useEffect, useState } from 'react';

export const EmojiPicker = ({ onEmojiSelect }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="w-full">
      <Picker
        data={data}
        onEmojiSelect={onEmojiSelect}
        theme="dark"
        set="twitter"
        previewPosition="none"
        skinTonePosition="none"
        navPosition="bottom"
        perLine={8}
        maxFrequentRows={1}
      />
    </div>
  );
}; 