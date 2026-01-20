import { useStore } from '../../stores/useStore'
import { AnimatePresence, motion } from 'framer-motion'
import { stopSpeaking } from '../../utils/textToSpeech'
import { useEffect } from 'react'

export function Interface() {
    const { isLocked, interactionData, setInteractionData } = useStore()

    const handleClose = () => {
        stopSpeaking();
        setInteractionData(null);
        
        // Don't auto re-lock, let user click to continue
        console.log('💡 Popup closed. Click on canvas to continue exploring.');
    }



    // Handle pointer lock changes when popup opens/closes
    useEffect(() => {
        const handlePointerLockChange = () => {
            // Just log the state change, don't try to auto re-lock
            if (document.pointerLockElement) {
                console.log('🔒 Pointer locked');
            } else {
                console.log('🔓 Pointer unlocked');
            }
        };

        document.addEventListener('pointerlockchange', handlePointerLockChange);
        return () => document.removeEventListener('pointerlockchange', handlePointerLockChange);
    }, [])

    return (
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
            {/* Reticle */}
            {isLocked && (
                <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-white rounded-full transform -translate-x-1/2 -translate-y-1/2 opacity-50 mix-blend-difference" />
            )}

            {/* Start Prompt */}
            {!isLocked && (
                <div className="absolute top-0 left-0 w-full h-full flex flex-col items-center justify-center bg-black/60 text-white z-50 pointer-events-auto cursor-pointer"
                    onClick={() => {
                        console.log('🖱️ Requesting pointer lock...');
                        document.querySelector('canvas').requestPointerLock();
                    }}
                >
                    <h1 className="text-4xl font-bold mb-4 text-center">TƯ TƯỞNG HỒ CHÍ MINH VỀ ĐẢNG CỘNG SẢN VIỆT NAM VÀ NHÀ NƯỚC CỦA NHÂN DÂN, DO NHÂN DÂN, VÌ NHÂN DÂN</h1>
                    <p className="text-xl animate-pulse">Nhấp chuột để Khám phá (WASD + Chuột)</p>
                    
                </div>
            )}

            {/* Interaction Panel */}
            <AnimatePresence>
                {interactionData && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="absolute bottom-10 left-1/2 transform -translate-x-1/2 w-full max-w-2xl bg-black/90 text-white p-6 rounded-lg pointer-events-auto border border-yellow-500/30 backdrop-blur-md shadow-[0_0_30px_rgba(255,215,0,0.2)]"
                    >
                        <div className="flex justify-between items-start mb-2 border-b border-white/10 pb-2">
                            <h2 className="text-3xl font-bold text-yellow-400 font-serif tracking-wide">{interactionData.title}</h2>
                            <div className="flex gap-2">
                                <button
                                    onClick={stopSpeaking}
                                    className="text-gray-400 hover:text-white transition-colors px-2"
                                    title="Dừng giọng nói"
                                >
                                    <span className="text-xl">🔇</span>
                                </button>
                                <button
                                    onClick={handleClose}
                                    className="text-gray-400 hover:text-white transition-colors"
                                    title="Đóng"
                                >
                                    <span className="text-2xl">✕</span>
                                </button>
                            </div>
                        </div>
                        <div className="max-h-[30vh] overflow-y-auto pr-2 custom-scrollbar">
                            <p className="text-lg leading-relaxed whitespace-pre-line text-gray-200">{interactionData.content}</p>
                        </div>
                        <div className="mt-3 pt-3 border-t border-white/10 text-center">
                            <p className="text-sm text-gray-400">
                                🔊 Đang phát giọng nói tự động...
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                Popup sẽ tự động đóng khi giọng nói kết thúc
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Instructions */}
            {isLocked && !interactionData && (
                <div className="absolute bottom-4 left-4 text-white/50 text-sm">
                    WASD để Di chuyển | Chuột để Nhìn | Click vào tranh để xem thông tin | ESC để Tạm dừng
                </div>
            )}
            
            {/* Instructions when popup is open */}
            {isLocked && interactionData && (
                <div className="absolute bottom-4 left-4 text-white/70 text-sm bg-black/50 px-3 py-2 rounded">
                    <span className="text-yellow-400 font-bold">✕</span> = Đóng popup | 
                    <span className="text-yellow-400 font-bold"> ESC</span> = Tạm dừng game
                </div>
            )}
            

        </div>
    )
}
