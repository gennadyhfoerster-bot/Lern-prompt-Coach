import { useState, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '../../components/ui/Button';
import { achievementEngine } from '../../lib/achievementEngine';

interface Tool {
  id: string;
  title: string;
  description: string;
  icon: string;
  component: ReactNode;
}

export function ToolsLayout({ tools, onBack }: { tools: Tool[], onBack: () => void }) {
  const [activeToolId, setActiveToolId] = useState<string | null>(null);

  const handleSelectTool = (id: string) => {
    setActiveToolId(id);
    achievementEngine.trackEvent('toolsUsed');
  };

  return (
    <main className="flex-1 p-8 flex flex-col gap-8 z-10 overflow-y-auto h-screen">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold">
          {activeToolId ? tools.find(t => t.id === activeToolId)?.title : 'Tools'}
        </h1>
        <Button 
          variant="secondary" 
          onClick={() => activeToolId ? setActiveToolId(null) : onBack()}
        >
          {activeToolId ? '← Zurück zu Tools' : '← Zurück'}
        </Button>
      </div>

      <AnimatePresence mode="wait">
        {!activeToolId ? (
          <motion.div 
            key="grid"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {tools.map(tool => (
              <motion.div 
                key={tool.id} 
                whileHover={{ y: -5 }}
                onClick={() => handleSelectTool(tool.id)} 
                className="bento-card hover:border-primary/50 cursor-pointer group transition-all"
              >
                <div className="text-4xl mb-4">{tool.icon}</div>
                <h3 className="text-2xl font-bold mb-2 group-hover:text-primary transition-colors">{tool.title}</h3>
                <p className="text-text-secondary text-sm">{tool.description}</p>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1"
          >
            {tools.find(t => t.id === activeToolId)?.component}
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
