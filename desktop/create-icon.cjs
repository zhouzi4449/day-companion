const fs=require('node:fs');
const path=require('node:path');
const sharp=require(process.env.SHARP_MODULE_PATH || 'sharp');
(async()=>{
  const root=path.resolve(__dirname,'../assets');
  const sizes=[16,24,32,48,64,128,256];
  const images=await Promise.all(sizes.map(size=>sharp(path.join(root,'icon.svg')).resize(size,size).png().toBuffer()));
  const header=Buffer.alloc(6+16*images.length);header.writeUInt16LE(1,2);header.writeUInt16LE(images.length,4);
  let offset=header.length;
  images.forEach((image,index)=>{const start=6+16*index;header[start]=sizes[index]===256?0:sizes[index];header[start+1]=header[start];header.writeUInt16LE(1,start+4);header.writeUInt16LE(32,start+6);header.writeUInt32LE(image.length,start+8);header.writeUInt32LE(offset,start+12);offset+=image.length;});
  fs.writeFileSync(path.join(root,'icon.ico'),Buffer.concat([header,...images]));
  await sharp(path.join(root,'icon.svg')).resize(256,256).png().toFile(path.join(root,'icon.png'));
  console.log('已生成应用图标：SVG、PNG、7尺寸ICO。');
})().catch(error=>{console.error(error);process.exitCode=1;});
