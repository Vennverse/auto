import { ReactNode } from "react";
import { useUsageEnforcement } from "@/hooks/useUsageEnforcement";
import FeatureBlockModal from "@/components/FeatureBlockModal";
import { useAuth } from "@/hooks/use-auth";

interface PremiumGateProps {
  children: ReactNode;
  feature: string;
  blockOnLimit?: boolean;
}

/**
 * PremiumGate component that wraps features and enforces premium upgrades
 * blockOnLimit: if true, completely blocks access when limit reached
 */
export default function PremiumGate({ children, feature, blockOnLimit = true }: PremiumGateProps) {
  const { user } = useAuth();
  const { 
    isFeatureBlocked, 
    showUpgradeModal, 
    setShowUpgradeModal, 
    blockedFeature,
    getRemainingUsage
  } = useUsageEnforcement();

  const isBlocked = blockOnLimit && isFeatureBlocked(feature);
  const remaining = getRemainingUsage(feature);
  
  if (isBlocked) {
    return (
      <>
        <div className="relative">
          <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm z-10 flex items-center justify-center">
            <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🔒</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Premium Required</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                You've used all your free {feature} allowances this month.
              </p>
              <button 
                onClick={() => setShowUpgradeModal(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all"
              >
                Upgrade to Premium
              </button>
            </div>
          </div>
          <div className="opacity-30 pointer-events-none">
            {children}
          </div>
        </div>
        
        <FeatureBlockModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          feature={blockedFeature || feature}
          userType={user?.userType}
        />
      </>
    );
  }

  // Show warning when approaching limits
  if (remaining <= 1 && remaining > 0) {
    return (
      <>
        <div className="relative">
          <div className="border-2 border-yellow-400 rounded-lg">
            <div className="bg-yellow-50 dark:bg-yellow-950 p-2 rounded-t-lg border-b border-yellow-200">
              <p className="text-sm text-yellow-800 dark:text-yellow-200 text-center">
                ⚠️ Last {feature} remaining! Upgrade to premium for unlimited access.
              </p>
            </div>
            {children}
          </div>
        </div>
        
        <FeatureBlockModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          feature={feature}
          userType={user?.userType}
        />
      </>
    );
  }

  return (
    <>
      {children}
      <FeatureBlockModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        feature={feature}
        userType={user?.userType}
      />
    </>
  );
}