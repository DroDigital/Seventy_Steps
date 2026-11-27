import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { iconPixels, iconPng, rgbaPng } from '../desktop/icon.js';

const shellImages = [
  ['StoreLogo', 100],
  ['Square150x150Logo', 150],
  ['Square44x44Logo', 44],
];

function splashScreen() {
  const width = 1920;
  const height = 1080;
  const size = 512;
  const art = iconPixels(size, 'plain');
  const background = Buffer.from([9, 9, 11, 255]);
  const pixels = Buffer.alloc(width * height * 4, background);
  const left = (width - size) / 2;
  const top = (height - size) / 2;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const edge = Math.min(x, y, size - x - 1, size - y - 1);
      const opacity = Math.min(1, edge / 48);
      const source = (y * size + x) * 4;
      const target = ((top + y) * width + left + x) * 4;
      for (let c = 0; c < 3; c++) {
        pixels[target + c] = Math.round(background[c] + (art[source + c] - background[c]) * opacity);
      }
    }
  }
  return rgbaPng(width, height, pixels);
}

/** Add the PC GDK manifest and shell images to a staged Windows build. */
export function prepareMicrosoftStore(payloadDir, version) {
  const parts = version.split('.').map(Number);
  if (!/^(0|[1-9]\d{0,4})(\.(0|[1-9]\d{0,4})){2}$/.test(version)
      || parts.some((part) => part > 65535)
      || parts.every((part) => part === 0)) {
    throw new Error(`Microsoft Store package version requires three integers from 0 to 65535 with at least one nonzero component. Got "${version}".`);
  }

  for (const [name, size] of shellImages) {
    writeFileSync(join(payloadDir, `${name}.png`), iconPng(size, 'plain'));
  }
  writeFileSync(join(payloadDir, 'SplashScreenImage.png'), splashScreen());

  writeFileSync(join(payloadDir, 'MicrosoftGame.config'), `<?xml version="1.0" encoding="utf-8"?>
<Game configVersion="1">
  <Identity Name="DigitalDro.SeventySteps"
            Publisher="CN=71719126-39AC-4AE5-AEDC-C058AADC8F07"
            Version="${version}.0" />
  <StoreId>9NPXF7D955V7</StoreId>
  <Resources>
    <Resource Language="en-US" />
    <Resource Language="de-DE" />
    <Resource Language="fr-FR" />
    <Resource Language="es-ES" />
  </Resources>
  <ExecutableList>
    <Executable Name="SeventySteps.exe" Id="Game" TargetDeviceFamily="PC" />
  </ExecutableList>
  <ShellVisuals DefaultDisplayName="Seventy Steps"
                PublisherDisplayName="Digital Dro"
                Description="A Lovecraftian open-world soulslike in retro 3D."
                StoreLogo="StoreLogo.png"
                Square150x150Logo="Square150x150Logo.png"
                Square44x44Logo="Square44x44Logo.png"
                SplashScreenImage="SplashScreenImage.png"
                BackgroundColor="#09090B" />
  <DesktopRegistration>
    <ProcessorArchitecture>x64</ProcessorArchitecture>
  </DesktopRegistration>
</Game>
`);
}
