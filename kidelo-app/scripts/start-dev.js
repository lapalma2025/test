/**
 * Jedna komenda dev: wykrywa IP Wi-Fi, uruchamia Expo z QR w terminalu.
 * Przy telefonie pod USB próbuje też adb reverse + otwarcie Expo Go.
 */
const { spawn, execSync } = require('child_process');
const os = require('os');
const path = require('path');

const root = path.join(__dirname, '..');

function getLanIp() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    if (/virtual|wsl|hyper-v|vethernet|loopback|bluetooth/i.test(name)) continue;
    for (const net of nets[name] || []) {
      if (net.family === 'IPv4' && !net.internal && !net.address.startsWith('169.254.')) {
        return net.address;
      }
    }
  }
  return null;
}

function tryUsbShortcut(ip) {
  try {
    execSync('adb devices', { stdio: 'pipe', timeout: 3000 });
    execSync('adb reverse tcp:8081 tcp:8081', { stdio: 'pipe', timeout: 3000 });
    const url = `exp://${ip}:8081`;
    execSync(`adb shell am start -a android.intent.action.VIEW -d "${url}"`, {
      stdio: 'pipe',
      timeout: 5000,
    });
    console.log('Telefon (USB): probuje otworzyc Expo Go automatycznie.\n');
  } catch {
    // brak adb / brak telefonu — normalne, skanuj QR
  }
}

const ip = getLanIp();
const env = { ...process.env };

if (ip) {
  env.REACT_NATIVE_PACKAGER_HOSTNAME = ip;
  console.log('');
  console.log('  Kidelo — skanuj QR w terminalu albo w Expo Go wpisz:');
  console.log(`  exp://${ip}:8081`);
  console.log('');
  tryUsbShortcut(ip);
} else {
  console.warn('Nie znaleziono IP Wi-Fi — upewnij sie, ze jestes w tej samej sieci co telefon.');
}

const child = spawn('npx', ['expo', 'start', '--lan', '--clear'], {
  cwd: root,
  env,
  stdio: 'inherit',
  shell: true,
});

child.on('exit', (code) => process.exit(code ?? 0));
