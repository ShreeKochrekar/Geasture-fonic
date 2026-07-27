import React from 'react';
import { useAppStore } from '../store/appStore';

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsDrawer: React.FC<SettingsDrawerProps> = ({ isOpen, onClose }) => {
  const { startCalibration } = useAppStore();

  const [sensitivity, setSensitivity] = React.useState<number>(85);

  return (
    <>
      {/* Backdrop overlay */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] transition-opacity duration-300"
        />
      )}

      {/* Drawer Panel */}
      <div 
        className={`fixed right-0 top-0 h-full w-80 bg-surface-dim border-l border-outline-variant/30 z-[120] p-6 flex flex-col gap-6 transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex justify-between items-center border-b border-outline-variant/15 pb-4">
          <span className="font-label-bold text-xs text-primary tracking-widest uppercase">CONFIGURATION</span>
          <button 
            onClick={onClose}
            className="material-symbols-outlined text-on-surface-variant hover:text-white transition-colors"
          >
            close
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col gap-6 overflow-y-auto pr-1">
          {/* Tracking Sensitivity */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between font-label-mono text-[10px] text-on-surface-variant">
              <span>TRACKING_SENSITIVITY</span>
              <span>{sensitivity}%</span>
            </div>
            <input 
              type="range" 
              min="20" 
              max="100" 
              value={sensitivity}
              onChange={(e) => setSensitivity(parseInt(e.target.value))}
              className="w-full h-1 bg-surface-variant rounded-none accent-primary cursor-pointer"
            />
          </div>

          {/* Recalibration trigger */}
          <div className="border-t border-outline-variant/15 pt-4">
            <button
              onClick={() => {
                onClose();
                startCalibration();
              }}
              className="w-full py-3 bg-surface border border-primary text-primary hover:bg-primary/5 font-label-bold text-xs tracking-wider uppercase"
            >
              [ RE-CALIBRATE SPATIALS ]
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="font-label-mono text-[8px] text-on-surface-variant opacity-40 text-center border-t border-outline-variant/15 pt-4">
          GESTUREFONIC CONFIG v2.4.0
        </div>
      </div>
    </>
  );
};
