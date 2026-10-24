import fs from 'node:fs/promises';
import {Presentation,PresentationFile} from 'file:///C:/Users/USER/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@oai/artifact-tool/dist/artifact_tool.mjs';
const p=Presentation.create({slideSize:{width:1280,height:720}}),s=p.slides.add();s.background.fill='#173f31';
const variants=['از مزرعه تا فرصت تجاری','\u200fاز مزرعه تا فرصت تجاری','\u202bاز مزرعه تا فرصت تجاری\u202c'];
for(let i=0;i<3;i++){const a=s.shapes.add({geometry:'textbox',position:{left:80,top:60+i*190,width:1120,height:150},fill:'none',line:{fill:'none',width:0}});a.text=[{runs:[variants[i]],paragraphStyle:{rtl:true,rightToLeft:true}}];a.text.style={fontSize:56,typeface:'Tahoma',color:'#ffffff',alignment:'right',insets:0};}
await fs.writeFile(new URL('rtl-probe.png',import.meta.url),new Uint8Array(await (await p.export({slide:s,format:'png',scale:1})).arrayBuffer()));
await (await PresentationFile.exportPptx(p)).save('C:/Users/USER/Desktop/Brix-Farmer/.build/product-deck-20261024/rtl-probe.pptx');
