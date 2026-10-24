import path from 'node:path';
import {finalizePresentation} from 'file:///C:/Users/USER/.codex/plugins/cache/openai-primary-runtime/presentations/26.1022.11436/skills/presentations/container_tools/artifact_tool_utils.mjs';
const workspaceDir='C:/Users/USER/Desktop/Brix-Farmer';
const skill='C:/Users/USER/.codex/plugins/cache/openai-primary-runtime/presentations/26.1022.11436/skills/presentations';
const result=await finalizePresentation({
 workspaceDir,candidatePath:path.join(workspaceDir,'.build/product-deck-20261024/candidate-rtl.pptx'),
 finalPath:path.join(workspaceDir,'outputs/AgriTrade_Product_Showcase_FA_Final.pptx'),
 pythonExecutable:'C:/Users/USER/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe',
 integrityValidatorPath:path.join(skill,'container_tools/inspect_presentation_package_integrity.py'),
 layoutValidatorPath:path.join(skill,'container_tools/inspect_presentation_layout_geometry.py'),
 layoutArgs:['--expected-slide-size-emu','12192000,6858000','--validate-bullet-geometry','--validate-heading-fit'],
 explicitTotalSlideCount:16,requiredNativeTableOwnerSlides:[],requiredNativeChartOwnerSlides:[],
 fontPolicy:{basis:'design',families:['Tahoma']},verifyArtifactToolImport:true,
 receiptPath:path.join(workspaceDir,'.build/product-deck-20261024/final-validation-v2.json'),
});
console.log(JSON.stringify({finalPath:result.finalPath||result.path,status:result.status||'validated'}));
