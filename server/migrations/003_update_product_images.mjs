export async function up({ run, queryAll, queryOne }){
  // Update specific seeded products that used placeholder images
  const updates = [
    { id:'iot-1003', thumb:'/assets/images/about-store.svg', images:['/assets/images/about-store.svg'] },
    { id:'iot-1004', thumb:'/assets/images/electronics-speaker.svg', images:['/assets/images/electronics-speaker.svg'] },
    { id:'iot-1008', thumb:'/assets/images/electronics-camera.svg', images:['/assets/images/electronics-camera.svg'] },
    { id:'iot-1009', thumb:'/assets/images/electronics-camera.svg', images:['/assets/images/electronics-camera.svg'] },
  ];
  for(const u of updates){
    await run('UPDATE products SET thumbnail=?, images_json=? WHERE id=?', [u.thumb, JSON.stringify(u.images), u.id]);
  }
}

