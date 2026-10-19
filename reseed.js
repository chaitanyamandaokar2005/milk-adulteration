const { AdulterantModel } = require('./models/Adulterant');

async function reseed() {
  console.log('Reseeding adulterants database with calibrated reference colors...');
  await AdulterantModel.seed();
  const list = await AdulterantModel.find({});
  console.log('Seeded adulterants count:', list.length);
  list.forEach(a => {
    console.log(`- ${a.name} (${a.slug}):`);
    console.log(`  Pure: ${a.pureColor.hex} RGB(${a.pureColor.rgb})`);
    console.log(`  Adult: ${a.adulteratedColor.hex} RGB(${a.adulteratedColor.rgb})`);
  });
  process.exit(0);
}

reseed().catch(err => {
  console.error(err);
  process.exit(1);
});
