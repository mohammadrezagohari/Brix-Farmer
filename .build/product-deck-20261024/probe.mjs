import fs from 'node:fs/promises';
import {Presentation,PresentationFile} from 'file:///C:/Users/USER/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@oai/artifact-tool/dist/artifact_tool.mjs';
const p=Presentation.create({slideSize:{width:1280,height:720}});
const s=p.slides.add();s.background.fill='#173f31';
const a=s.shapes.add({geometry:'textbox',position:{left:100,top:150,width:1080,height:300},fill:'none',line:{fill:'none',width:0}});
a.text='از مزرعه تا فرصت تجاری\nپلتفرم کشاورزی و تجارت';a.text.style={fontSize:62,typeface:'Tahoma',color:'#ffffff',alignment:'right',insets:0,verticalAlignment:'middle'};
await fs.writeFile(new URL('probe.png',import.meta.url),new Uint8Array(await (await p.export({slide:s,format:'png',scale:1})).arrayBuffer()));
await (await PresentationFile.exportPptx(p)).save(new URL('probe.pptx',import.meta.url).pathname.replace(/^\/C:/,'C:'));
console.log('Probe rendered');
