
import React from 'react';
import { useTheme } from '@/context/ThemeContext';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Paintbrush } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ThemeSelector: React.FC = () => {
  const { theme, setTheme } = useTheme();
  
  const themes = [
    { id: 'default', name: 'Default', color: 'bg-primary' },
    { id: 'neon', name: 'Neon', color: 'bg-theme-neon' },
    { id: 'pastel', name: 'Pastel', color: 'bg-theme-pastel' },
    { id: 'midnight', name: 'Midnight', color: 'bg-theme-midnight' },
    { id: 'sunset', name: 'Sunset', color: 'bg-theme-sunset' },
  ];
  
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          size="icon"
          className="relative group"
        >
          <Paintbrush className="h-5 w-5" />
          <span className="sr-only">Change theme</span>
          <div className="absolute inset-0 rounded-md overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-full h-1/5 bg-theme-neon" />
            <div className="w-full h-1/5 bg-theme-pastel" />
            <div className="w-full h-1/5 bg-theme-midnight" />
            <div className="w-full h-1/5 bg-theme-sunset" />
            <div className="w-full h-1/5 bg-primary" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56" align="end">
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Choose a theme</h4>
          <div className="grid grid-cols-5 gap-2 py-2">
            {themes.map((t) => (
              <button
                key={t.id}
                className={`theme-selector ${t.color} ${theme === t.id ? 'ring-2 ring-ring ring-offset-2' : ''}`}
                onClick={() => setTheme(t.id as any)}
                title={t.name}
              />
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ThemeSelector;
