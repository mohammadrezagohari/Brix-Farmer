import {ImageResponse} from 'next/og';
export const alt='AgriTrade — Local roots. New possibilities.';
export const size={width:1200,height:630};
export const contentType='image/png';
export default function Image(){return new ImageResponse(<div style={{display:'flex',flexDirection:'column',justifyContent:'space-between',width:'100%',height:'100%',background:'#173f31',color:'#f1f4df',padding:'70px 80px'}}><div style={{display:'flex',fontSize:30,letterSpacing:5,color:'#c3d79e'}}>AGRITRADE / AGRICULTURE × OPPORTUNITY</div><div style={{display:'flex',flexDirection:'column',fontSize:86,lineHeight:1.12,fontWeight:700}}><span>Local roots.</span><span style={{color:'#c3d79e'}}>New possibilities.</span></div><div style={{display:'flex',fontSize:26}}>A shared workspace for farmers and traders.</div></div>,size);}
