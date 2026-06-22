import type { OptimizationExecutionTarget } from "../OptimizationExecutionTypes";
import { WindowsSearchExecutor } from "./WindowsSearchExecutor";
import { WindowsSearchRecovery } from "./WindowsSearchRecovery";
import { WindowsSearchVerifier } from "./WindowsSearchVerifier";

const executor = new WindowsSearchExecutor();
const verifier = new WindowsSearchVerifier();
const recovery = new WindowsSearchRecovery();

export const WindowsSearchExecutionTarget: OptimizationExecutionTarget = {
  id: "windows-search",
  capabilities: {
    canRealApply: true,
    canVerify: true,
    canRecover: true,
    applyMode: "real",
    verificationMode: "real",
    recoveryMode: "real"
  },
  apply: () => executor.apply(),
  verifyApply: () => verifier.verifyApply(),
  verifyRecovery: (historyEntryId) => verifier.verifyRecovery(historyEntryId),
  recover: (historyEntryId) => recovery.recover(historyEntryId)
};
